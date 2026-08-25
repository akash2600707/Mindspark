import {NextResponse} from 'next/server';
import {supabaseAdmin} from '@/lib/supabase-admin';
import crypto from 'crypto';

const hash=(v:string)=>crypto.createHash('sha256').update(v).digest('hex');

async function advanceIfExpired(db:any, quizId:string, state:any){
  if(!state || state.status!=='LIVE' || !state.current_question_id || !state.question_ends_at) return state;
  if(Date.now() < new Date(state.question_ends_at).getTime()) return state;

  const {data:currentQuestion}=await db.from('questions')
    .select('id,question_number')
    .eq('id',state.current_question_id)
    .maybeSingle();
  if(!currentQuestion) return state;

  const {data:nextQuestion}=await db.from('questions')
    .select('id,question_number,time_limit_seconds')
    .eq('quiz_id',quizId)
    .gt('question_number',currentQuestion.question_number)
    .order('question_number',{ascending:true})
    .limit(1)
    .maybeSingle();

  if(!nextQuestion){
    const {error}=await db.from('quiz_state').update({
      status:'COMPLETED',
      current_question_id:null,
      question_started_at:null,
      question_ends_at:null,
    }).eq('quiz_id',quizId).eq('status','LIVE').eq('current_question_id',state.current_question_id);
    if(!error) await db.from('quizzes').update({status:'COMPLETED'}).eq('id',quizId).eq('status','LIVE');
    return {...state,status:'COMPLETED',current_question_id:null,question_started_at:null,question_ends_at:null};
  }

  const startedAt=new Date();
  const endsAt=new Date(startedAt.getTime()+(nextQuestion.time_limit_seconds||15)*1000);
  const {data:updated,error}=await db.from('quiz_state').update({
    status:'LIVE',
    current_question_id:nextQuestion.id,
    question_started_at:startedAt.toISOString(),
    question_ends_at:endsAt.toISOString(),
  }).eq('quiz_id',quizId).eq('status','LIVE').eq('current_question_id',state.current_question_id).select('*').maybeSingle();
  if(!error && updated) return updated;
  const {data:fresh}=await db.from('quiz_state').select('*').eq('quiz_id',quizId).maybeSingle();
  return fresh||state;
}

export async function POST(req:Request){
  try{
    const {participantCode,sessionToken}=await req.json();
    if(!participantCode||!sessionToken)return NextResponse.json({error:'Missing session.'},{status:400});
    const db=supabaseAdmin();
    const {data:p}=await db.from('participants').select('id,quiz_id,full_name,status').eq('participant_code',String(participantCode).toUpperCase()).maybeSingle();
    if(!p)return NextResponse.json({error:'Participant not found.'},{status:404});
    const {data:s}=await db.from('sessions').select('id,active').eq('participant_id',p.id).eq('session_token_hash',hash(sessionToken)).maybeSingle();
    if(!s?.active)return NextResponse.json({error:'Session expired.'},{status:401});
    await db.from('sessions').update({last_seen_at:new Date().toISOString()}).eq('id',s.id);

    let {data:state}=await db.from('quiz_state').select('quiz_id,status,current_question_id,question_started_at,question_ends_at').eq('quiz_id',p.quiz_id).maybeSingle();
    if(!state)return NextResponse.json({status:'WAITING',fullName:p.full_name});

    state=await advanceIfExpired(db,p.quiz_id,state);

    let question=null;
    if(state.current_question_id){
      const {data:q}=await db.from('questions').select('id,question_number,question_text,option_a,option_b,option_c,option_d,points,time_limit_seconds,image_url,category').eq('id',state.current_question_id).maybeSingle();
      if(q)question=q;
    }
    let answer=null;
    if(question){
      const {data:a}=await db.from('answers').select('selected_option,points_awarded,is_correct').eq('participant_id',p.id).eq('question_id',question.id).maybeSingle();
      answer=a||null;
    }
    return NextResponse.json({status:state.status,fullName:p.full_name,question,questionStartedAt:state.question_started_at,questionEndsAt:state.question_ends_at,answer});
  }catch(e){
    console.error(e);
    return NextResponse.json({error:'Server error.'},{status:500});
  }
}
