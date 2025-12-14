"use client";
import React, { useState } from 'react';
import { Calendar, Users, MessageSquare, TrendingUp, AlertCircle, Play, RefreshCw, CheckCircle, XCircle, Zap } from 'lucide-react';

const RedditMastermind = () => {
  const [activeTab, setActiveTab] = useState('configure');
  const [isGenerating, setIsGenerating] = useState(false);
  const [calendars, setCalendars] = useState([]);
  const [qualityScore, setQualityScore] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [apiKey] = useState('REMOVED_SECRET');
  
  const [newPersona, setNewPersona] = useState({
    name: '', role: '', background: '', tone: '', expertise: '', perspective: '', mentionProduct: 0.15
  });
  const [newSubreddit, setNewSubreddit] = useState('');
  const [newQuery, setNewQuery] = useState('');

  const [config, setConfig] = useState({
    companyInfo: {
      name: 'SlideForge',
      description: 'AI-powered presentation tool that helps teams create professional slides in minutes',
      valueProps: ['Saves 5+ hours per presentation', 'AI suggests layouts and content', 'Team collaboration built-in', 'Exports to PowerPoint/Google Slides'],
      targetAudience: 'Product managers, consultants, sales teams, educators',
      competitors: 'Canva, PowerPoint, Pitch, Beautiful.ai'
    },
    personas: [
      {
        id: 'p1',
        name: 'Sarah Chen',
        role: 'Product Manager at Series B SaaS startup',
        background: '5 years PM experience, creates 3-4 decks per week for stakeholders and leadership',
        tone: 'Professional but approachable, data-driven, sometimes skeptical of new tools',
        expertise: 'Product strategy, stakeholder management, OKRs and metrics',
        perspective: 'Values efficiency and process, questions hype, wants proven solutions',
        mentionProduct: 0.2
      },
      {
        id: 'p2',
        name: 'Marcus Thompson',
        role: 'Independent management consultant',
        background: 'Ex-McKinsey consultant, now runs boutique consulting practice, creates client deliverables weekly',
        tone: 'Direct and pragmatic, occasionally contrarian, values ROI over features',
        expertise: 'Client presentations, business strategy, consulting frameworks',
        perspective: 'Challenges assumptions, prefers battle-tested methods, skeptical of trendy solutions',
        mentionProduct: 0.15
      },
      {
        id: 'p3',
        name: 'Emily Rodriguez',
        role: 'Design lead at digital agency',
        background: '8 years design experience, obsessed with visual quality and user experience',
        tone: 'Creative and detail-oriented, advocates for design excellence, helpful but opinionated',
        expertise: 'Visual design, presentation aesthetics, design systems',
        perspective: 'Believes design quality trumps speed, willing to invest time for polish',
        mentionProduct: 0.1
      }
    ],
    subreddits: ['r/ProductManagement', 'r/consulting', 'r/Entrepreneur', 'r/SaaS', 'r/productivity'],
    queries: [
      'How do you create client presentations quickly?',
      'What tools do PMs use for stakeholder updates?',
      'Best practices for quarterly business reviews',
      'How to make presentations less time-consuming'
    ],
    postsPerWeek: 3
  });

  // SUBREDDIT-SPECIFIC CONTEXT
  const subredditContext = {
    'r/ProductManagement': {
      culture: 'Professional, data-focused, stakeholder management challenges, career development',
      commonTerms: 'roadmap, stakeholders, sprint review, OKRs, product strategy, user stories, prioritization',
      painPoints: 'exec updates, quarterly business reviews, board meetings, alignment with engineering, data-driven decisions',
      tone: 'Strategic and analytical, professional',
      avoidBehaviors: 'Avoid: sales pitches, generic advice, non-PM specific content, overly casual language',
      communityValues: 'Value specificity, data, real-world examples, career growth advice'
    },
    'r/consulting': {
      culture: 'Client-focused, efficiency-obsessed, professional polish required, billable hours matter',
      commonTerms: 'client deliverables, engagement, frameworks, slide deck, partner review, utilization, SOW',
      painPoints: 'tight client deadlines, maintaining quality under pressure, team collaboration on decks, client expectations',
      tone: 'Direct and results-oriented, professional',
      avoidBehaviors: 'Avoid: academic language, internal team focus only, overly casual tone, non-consulting contexts',
      communityValues: 'Efficiency, client satisfaction, proven methodologies, quality output'
    },
    'r/Entrepreneur': {
      culture: 'Hustle mentality, bootstrapping mindset, practical DIY solutions, resource constraints',
      commonTerms: 'pitch deck, investor meeting, bootstrapped, lean startup, MVP, traction, runway',
      painPoints: 'investor pitches, limited budget, wearing multiple hats, speed to market, looking professional on budget',
      tone: 'Scrappy and resourceful, action-oriented',
      avoidBehaviors: 'Avoid: corporate jargon, expensive solutions, complex enterprise processes, theory over practice',
      communityValues: 'Resourcefulness, speed, practical advice, real results'
    },
    'r/SaaS': {
      culture: 'Tech-savvy, integration and automation focused, workflow optimization, metrics-driven',
      commonTerms: 'workflow, integration, automation, tech stack, API, SaaS tools, productivity, scaling',
      painPoints: 'demo decks, sales presentations, product updates, team alignment, tool sprawl',
      tone: 'Technical and optimization-focused, efficiency-minded',
      avoidBehaviors: 'Avoid: non-technical language, manual processes, tools without integrations, vague benefits',
      communityValues: 'Automation, integration, scalability, measurable results'
    },
    'r/productivity': {
      culture: 'Life-hacking, time management systems, optimization mindset, practical efficiency',
      commonTerms: 'workflow, time management, productivity system, GTD, deep work, time blocking, automation',
      painPoints: 'time waste, context switching, repetitive tasks, organization systems, work-life balance',
      tone: 'Practical and time-conscious, system-oriented',
      avoidBehaviors: 'Avoid: work-only context, expensive solutions, overly complex systems, corporate-specific advice',
      communityValues: 'Time savings, simplicity, actionable systems, life improvement'
    }
  };

  // CORE: Call OpenAI API
  const callLLM = async (prompt: string, temperature: number = 0.8): Promise<string | null> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      
      if (!apiKey) {
        console.error('API key not found');
        return null;
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: temperature,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('LLM call failed:', error);
      return null;
    }
  };
  // Parse JSON from LLM response
  const parseJSON = (text) => {
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('JSON parse error:', error);
      return null;
    }
  };

  // STEP 1: Generate diverse core topics for the week
  const generateCoreTopics = async (config, weekNumber) => {
    const prompt = `You are a Reddit content strategist. Generate ${config.postsPerWeek} DIVERSE core topic concepts for a week ${weekNumber} content calendar.

Company: ${config.companyInfo.name} - ${config.companyInfo.description}
Target queries/topics: ${config.queries.join(', ')}

Requirements:
1. Each topic should be a DIFFERENT type of problem/discussion
2. Topics should be broad concepts that can be adapted to different subreddits
3. Focus on problems, NOT solutions or tools
4. Make them feel authentic (real frustrations people have)
5. Vary the emotional tone: some frustrated, some curious, some seeking advice

Return ONLY valid JSON (no other text):
{
  "topics": [
    {
      "id": "topic_1",
      "coreProblem": "brief description of the problem/challenge",
      "emotionalTone": "frustrated/curious/overwhelmed/seeking-advice",
      "targetAudience": "who experiences this",
      "why": "why this resonates"
    }
  ]
}`;

    const response = await callLLM(prompt, 0.9);
    const parsed = parseJSON(response);
    return parsed?.topics || [];
  };

  // STEP 2: Generate subreddit-specific post variation
  const generateSubredditPost = async (topic, subreddit, context, config, weekNumber) => {
    const prompt = `You are writing a Reddit post for ${subreddit}. This MUST sound authentic to this specific community.

SUBREDDIT CONTEXT:
- Culture: ${context.culture}
- Common terminology: ${context.commonTerms}
- Typical pain points: ${context.painPoints}
- Tone: ${context.tone}
- What to avoid: ${context.avoidBehaviors}
- What community values: ${context.communityValues}

TOPIC TO ADAPT:
Core problem: ${topic.coreProblem}
Emotional tone: ${topic.emotionalTone}

YOUR TASK:
Write a post that frames this problem SPECIFICALLY for ${subreddit}:
1. Use terminology from this community (${context.commonTerms.split(',')[0]}, ${context.commonTerms.split(',')[1]}, etc.)
2. Reference situations/contexts specific to ${subreddit} members
3. Add specific, believable details (numbers, frequencies, real scenarios)
4. Match the community's tone: ${context.tone}
5. Sound like a real person seeking genuine help
6. 100-180 words
7. NEVER mention ${config.companyInfo.name} or any specific tools
8. Make it feel personal and authentic

Return ONLY valid JSON:
{
  "title": "compelling question or problem statement",
  "body": "detailed post with specific examples and context",
  "expectedUpvotes": "high/medium/low based on how well it fits community"
}`;

    const response = await callLLM(prompt, 0.85);
    return parseJSON(response);
  };

  // STEP 3: Generate first persona comment
  const generateFirstComment = async (post, persona, subreddit, context, config) => {
    const prompt = `You are ${persona.name}, ${persona.role}.

YOUR CHARACTER:
- Background: ${persona.background}
- Tone: ${persona.tone}
- Expertise: ${persona.expertise}
- Perspective: ${persona.perspective}

SUBREDDIT: ${subreddit}
Community values: ${context.communityValues}

ORIGINAL POST:
"${post.title}"
${post.body}

YOUR TASK:
Write a casual, authentic Reddit comment. This is real Reddit, not LinkedIn.

CRITICAL - Make it feel HUMAN:
1. Keep it SHORT (40-80 words max) - Reddit comments are brief
2. Use casual language - "Yeah I've dealt with this" not "I experienced a similar situation"
3. Be conversational - fragments, contractions, informal tone
4. Skip pleasantries - jump straight to the point
5. ONE specific tip or experience, don't overexplain
6. Sound like you're typing quickly, not crafting an essay
7. NO tools or products
8. Match ${persona.tone} but keep it casual

BAD (too polished): "I experienced a similar challenge in my role. What I found effective was implementing a systematic approach..."
GOOD (authentic): "ugh same. what worked for me was just keeping a folder of old slides by topic. saves me like 2hrs every time"

Return ONLY the comment text.`;

    const response = await callLLM(prompt, 0.85);
    return response;
  };

  // STEP 4: Generate second persona comment (potentially disagreeing)
  const generateSecondComment = async (post, persona, firstComment, firstPersona, subreddit, context, config) => {
    const shouldDisagree = Math.random() < 0.5;
    
    const prompt = `You are ${persona.name}, ${persona.role}.

YOUR CHARACTER:
- Background: ${persona.background}
- Tone: ${persona.tone}
- Perspective: ${persona.perspective}

SUBREDDIT: ${subreddit}

ORIGINAL POST:
"${post.title}"

EXISTING COMMENT from ${firstPersona.name}:
"${firstComment}"

YOUR TASK:
${shouldDisagree ? 
  `You DISAGREE or have a DIFFERENT take than ${firstPersona.name}.

Examples of good disagreement:
- "hmm idk if that scales though"
- "tried that, honestly didn't work for my situation"
- "maybe but that seems like a lot of overhead?"
- "respectfully disagree - I find X way faster"

Be skeptical or offer contrasting view. Keep it conversational, not confrontational.` :
  `Ask a CLARIFYING QUESTION or add a different angle.

Examples:
- "how do you handle version control with that approach?"
- "interesting - does that work when you have multiple people editing?"
- "what about when timelines are super tight though?"

Or offer a complementary but distinct perspective.`
}

CRITICAL:
1. SHORT (30-70 words) - this is Reddit
2. Casual tone - contractions, informal language
3. ${shouldDisagree ? 'Question their approach or show skepticism' : 'Ask practical questions'}
4. Sound natural, not polished
5. NO tools or products

Return ONLY the comment text.`;

    const response = await callLLM(prompt, 0.88);
    return response;
  };

  // STEP 5: Generate follow-up comment (may mention product)
  const generateFollowUp = async (post, persona, previousComments, subreddit, context, config, shouldMention) => {
    const conversationSoFar = previousComments.map(c => 
      `${c.personaName}: ${c.content}`
    ).join('\n\n');

    const prompt = `You are ${persona.name}, ${persona.role}.

CONVERSATION SO FAR:
${conversationSoFar}

YOUR TASK:
Write a BRIEF follow-up response. Keep it short and natural.

${shouldMention ?
  `You can CASUALLY mention trying ${config.companyInfo.name} among other things.

Examples of good casual mentions:
- "yeah I've tried templates, ${config.companyInfo.name}, even just better docs. honestly the process matters more than the tool"
- "I tested a few things including ${config.companyInfo.name} but tbh what actually helped was..."
- "tried ${config.companyInfo.name} and some other stuff. mixed results but worth experimenting"

NOT promotional. Just mentioning in passing as ONE thing you tried.` :
  `Write a quick reply:
- Answer someone's question briefly
- Add a quick thought
- Ask a follow-up question

Examples:
- "good point, hadn't thought of that"
- "wait how do you handle [specific scenario]?"
- "yeah that's fair, I guess it depends on team size"`
}

CRITICAL:
1. VERY SHORT (20-50 words max)
2. Super casual - like texting a colleague
3. ${shouldMention ? 'Tool mention is brief and casual, not a pitch' : 'Pure conversation'}
4. Feel spontaneous, not crafted

Return ONLY the comment text.`;

    const response = await callLLM(prompt, 0.9);
    return response;
  };

  // NEW: Generate OP reply to comment
  const generateOPReply = async (post, comment, config) => {
    const prompt = `You are the original poster (OP) who wrote: "${post.title}"

Someone commented:
"${comment.content}"

Write a BRIEF reply as OP:
- Thank them or acknowledge their input
- Maybe ask a follow-up question
- Or share additional context about your situation
- Keep it conversational and short (15-40 words)

Examples:
- "thanks! do you use any specific structure for organizing those slides?"
- "interesting, I hadn't thought of that approach"
- "yeah that makes sense. how long did it take you to build that system?"

Return ONLY the reply text.`;

    const response = await callLLM(prompt, 0.85);
    return response;
  };

  // NEW: Generate persona replying to another persona
  const generatePersonaReply = async (replyingPersona, targetComment, post, config) => {
    const prompt = `You are ${replyingPersona.name}, ${replyingPersona.role}.

Someone else commented:
"${targetComment.content}"

Write a VERY SHORT reply (15-35 words):
- Agree/disagree with a specific point
- Ask a clarifying question
- Add a quick related thought
- Keep it super casual

Examples:
- "wait that's interesting - does that work for you with tight deadlines?"
- "yeah I've tried that too, mixed results tbh"
- "fair point, though I find [alternative] faster"

Return ONLY the reply text.`;

    const response = await callLLM(prompt, 0.9);
    return response;
  };

  // MAIN: Generate Content Calendar
  const generateContentCalendar = async (weekNumber = 1) => {
    setIsGenerating(true);
    
    try {
      // Track what we've used to avoid duplicates
      const usedSubreddits = {};
      const personaWeeklyAppearances = {};
      const personaThreadAppearances = {};
      const personaLastActive = {};
      config.personas.forEach(p => {
        personaLastActive[p.id] = -10;
        personaWeeklyAppearances[p.id] = 0;
      });
      
      // Step 1: Generate diverse core topics
      const coreTopics = await generateCoreTopics(config, weekNumber);
      
      if (!coreTopics || coreTopics.length === 0) {
        throw new Error('Failed to generate topics');
      }

      const posts = [];
      
      // Step 2: For each post slot, create subreddit-specific content
      for (let i = 0; i < config.postsPerWeek; i++) {
        // Pick subreddit (ensure distribution)
        let subreddit = config.subreddits[i % config.subreddits.length];
        
        // If this subreddit has been used too much, find an alternative
        if ((usedSubreddits[subreddit] || 0) >= 2) {
          // Find a subreddit that hasn't been used as much
          const alternativeSubreddit = config.subreddits.find(sr => (usedSubreddits[sr] || 0) < 2);
          if (alternativeSubreddit) {
            subreddit = alternativeSubreddit;
          }
        }
        
        usedSubreddits[subreddit] = (usedSubreddits[subreddit] || 0) + 1;
        
        const topic = coreTopics[i % coreTopics.length];
        const context = subredditContext[subreddit];
        
        // Generate subreddit-specific post
        const post = await generateSubredditPost(topic, subreddit, context, config, weekNumber);
        
        if (!post) continue;
        
        // Step 3: Assign personas with cooldown AND weekly limit
        let availablePersonas = config.personas.filter(p => 
          (i - personaLastActive[p.id]) >= 3 && // 3+ day cooldown
          personaWeeklyAppearances[p.id] < 2 // Max 2 threads per week per persona
        );
        
        // If no personas available with strict rules, relax the cooldown requirement
        if (availablePersonas.length === 0) {
          availablePersonas = config.personas.filter(p => 
            personaWeeklyAppearances[p.id] < 2 // Just check weekly limit
          );
        }
        
        // If still no personas, skip this post
        if (availablePersonas.length === 0) continue;
        
        // Randomly select 1-2 personas
        const numCommenters = Math.min(
          Math.floor(Math.random() * 2) + 1,
          availablePersonas.length
        );
        
        // Shuffle available personas to ensure randomness
        const shuffledPersonas = [...availablePersonas].sort(() => Math.random() - 0.5);
        
        const selectedPersonas = [];
        for (let j = 0; j < numCommenters; j++) {
          const persona = shuffledPersonas[j];
          selectedPersonas.push(persona);
          personaLastActive[persona.id] = i;
          personaWeeklyAppearances[persona.id] = (personaWeeklyAppearances[persona.id] || 0) + 1;
          personaThreadAppearances[`${i}_${persona.id}`] = 0;
        }
        
        // Step 4: Generate conversation thread
// Step 4: Generate conversation thread with MORE comments
        const thread = [];

        // First comment
        if (selectedPersonas.length > 0) {
          const firstPersona = selectedPersonas[0];
          const firstComment = await generateFirstComment(post, firstPersona, subreddit, context, config);
          
          if (firstComment) {
            thread.push({
              persona: firstPersona.name,
              personaId: firstPersona.id,
              content: firstComment,
              delay: Math.floor(Math.random() * 12) + 2,
              mentionsProduct: false
            });
            personaThreadAppearances[`${i}_${firstPersona.id}`] = 1;
          }
        }

        // Second comment (may disagree)
        if (selectedPersonas.length > 1 && thread.length > 0) {
          const secondPersona = selectedPersonas[1];
          const secondComment = await generateSecondComment(
            post, 
            secondPersona, 
            thread[0].content, 
            selectedPersonas[0],
            subreddit, 
            context, 
            config
          );
          
          if (secondComment) {
            thread.push({
              persona: secondPersona.name,
              personaId: secondPersona.id,
              content: secondComment,
              delay: Math.floor(Math.random() * 18) + 6,
              mentionsProduct: false
            });
            personaThreadAppearances[`${i}_${secondPersona.id}`] = 1;
          }
        }

        // OP replies to one of the first comments (80% chance)
        if (Math.random() < 0.8 && thread.length >= 1) {
          // OP replies to the first or second comment
          const replyTarget = thread[Math.floor(Math.random() * Math.min(2, thread.length))];
          const opReply = await generateOPReply(post, replyTarget, config);
          
          if (opReply) {
            thread.push({
              persona: '[OP]',
              personaId: 'op',
              content: opReply,
              delay: replyTarget.delay + Math.floor(Math.random() * 6) + 2,
              mentionsProduct: false,
              isOPReply: true,
              replyingTo: replyTarget.persona
            });
          }
        }

        // Third persona comment or follow-up (70% chance)
        if (Math.random() < 0.7 && thread.length >= 2) {
          const recentPersonaIds = thread.slice(-2).map(t => t.personaId);
          const availableForComment = selectedPersonas.filter(p => !recentPersonaIds.includes(p.id));
          
          if (availableForComment.length > 0) {
            const persona = availableForComment[Math.floor(Math.random() * availableForComment.length)];
            const threadKey = `${i}_${persona.id}`;
            
            if ((personaThreadAppearances[threadKey] || 0) < 2) {
              // Find a comment from a DIFFERENT persona to reply to
              const targetComment = thread.find(t => 
                t.personaId !== persona.id && 
                t.personaId !== 'op'
              );
              
              if (targetComment) {
                const personaReply = await generatePersonaReply(
                  persona,
                  targetComment,
                  post,
                  config
                );
                
                if (personaReply) {
                  thread.push({
                    persona: persona.name,
                    personaId: persona.id,
                    content: personaReply,
                    delay: targetComment.delay + Math.floor(Math.random() * 8) + 4,
                    mentionsProduct: false,
                    isReply: true,
                    replyingTo: targetComment.persona
                  });
                  personaThreadAppearances[threadKey] = (personaThreadAppearances[threadKey] || 0) + 1;
                }
              }
            }
          }
        }

        // Fourth comment - another persona or OP follow-up (60% chance)
        if (Math.random() < 0.6 && thread.length >= 3) {
          const recentPersonaIds = thread.slice(-2).map(t => t.personaId);
          
          // 50% chance it's OP replying again, 50% chance it's a persona
          if (Math.random() < 0.5 && !recentPersonaIds.includes('op')) {
            // OP replies to someone who isn't in the last 2 comments
            const replyTarget = thread.find(t => 
              t.personaId !== 'op' && 
              !recentPersonaIds.includes(t.personaId)
            );
            
            if (replyTarget) {
              const opReply = await generateOPReply(post, replyTarget, config);
              
              if (opReply) {
                thread.push({
                  persona: '[OP]',
                  personaId: 'op',
                  content: opReply,
                  delay: replyTarget.delay + Math.floor(Math.random() * 10) + 6,
                  mentionsProduct: false,
                  isOPReply: true,
                  replyingTo: replyTarget.persona
                });
              }
            }
          } else {
            // Persona replies
            const availableForComment = selectedPersonas.filter(p => !recentPersonaIds.includes(p.id));
            
            if (availableForComment.length > 0) {
              const persona = availableForComment[Math.floor(Math.random() * availableForComment.length)];
              const threadKey = `${i}_${persona.id}`;
              
              if ((personaThreadAppearances[threadKey] || 0) < 2) {
                const targetComment = thread.find(t => 
                  t.personaId !== persona.id && 
                  !recentPersonaIds.includes(t.personaId)
                );
                
                if (targetComment) {
                  const shouldMention = Math.random() < persona.mentionProduct;
                  
                  const previousComments = thread.map(t => ({
                    personaName: t.persona,
                    content: t.content
                  }));
                  
                  const followUp = await generateFollowUp(
                    post,
                    persona,
                    previousComments,
                    subreddit,
                    context,
                    config,
                    shouldMention
                  );
                  
                  if (followUp) {
                    thread.push({
                      persona: persona.name,
                      personaId: persona.id,
                      content: followUp,
                      delay: targetComment.delay + Math.floor(Math.random() * 12) + 8,
                      mentionsProduct: shouldMention,
                      isFollowUp: true,
                      replyingTo: targetComment.persona
                    });
                    personaThreadAppearances[threadKey] = (personaThreadAppearances[threadKey] || 0) + 1;
                  }
                }
              }
            }
          }
        }

        // Fifth comment - additional engagement (40% chance)
        if (Math.random() < 0.4 && thread.length >= 4) {
          const recentPersonaIds = thread.slice(-2).map(t => t.personaId);
          const availableForComment = selectedPersonas.filter(p => !recentPersonaIds.includes(p.id));
          
          if (availableForComment.length > 0) {
            const persona = availableForComment[Math.floor(Math.random() * availableForComment.length)];
            const threadKey = `${i}_${persona.id}`;
            
            if ((personaThreadAppearances[threadKey] || 0) < 2) {
              const targetComment = thread.find(t => 
                t.personaId !== persona.id && 
                t.personaId !== 'op' &&
                !recentPersonaIds.includes(t.personaId)
              );
              
              if (targetComment) {
                const personaReply = await generatePersonaReply(
                  persona,
                  targetComment,
                  post,
                  config
                );
                
                if (personaReply) {
                  thread.push({
                    persona: persona.name,
                    personaId: persona.id,
                    content: personaReply,
                    delay: targetComment.delay + Math.floor(Math.random() * 14) + 10,
                    mentionsProduct: false,
                    isReply: true,
                    replyingTo: targetComment.persona
                  });
                  personaThreadAppearances[threadKey] = (personaThreadAppearances[threadKey] || 0) + 1;
                }
              }
            }
          }
        }
        // Add post with thread
        posts.push({
          id: `post_${i + 1}`,
          subreddit,
          topic: topic.coreProblem,
          title: post.title,
          body: post.body,
          thread,
          scheduledTime: calculateScheduleTime(weekNumber, i, config.postsPerWeek)
        });
      }
      
      // Step 5: Quality check
      const qualityChecked = await deepQualityCheck(posts);
      
      const newCalendar = {
        week: weekNumber,
        posts: qualityChecked,
        generated: new Date().toISOString(),
        qualityScore: calculateAdvancedQualityScore(qualityChecked)
      };
      
      setCalendars(prev => [...prev, newCalendar]);
      setQualityScore(newCalendar.qualityScore);
      setIsGenerating(false);
      
      return newCalendar;
    } catch (error) {
      console.error('Generation error:', error);
      setIsGenerating(false);
      alert('Generation failed. Check console for details.');
    }
  };

  // Calculate schedule time
  const calculateScheduleTime = (weekNumber, postIndex, totalPosts) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
    
    const daysSpread = Math.floor(7 / totalPosts);
    const dayOffset = postIndex * daysSpread;
    
    startDate.setDate(startDate.getDate() + dayOffset);
    startDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
    
    return startDate.toISOString();
  };

  // Deep quality check
  const deepQualityCheck = async (posts) => {
    const issues = [];
    
    // Check for duplicate posts
    const postContents = posts.map(p => (p.body || '').toLowerCase());
    for (let i = 0; i < postContents.length; i++) {
      for (let j = i + 1; j < postContents.length; j++) {
        const similarity = calculateSimilarity(postContents[i], postContents[j]);
        if (similarity > 0.6) {
          issues.push({
            type: 'duplicate_post',
            posts: [posts[i].subreddit, posts[j].subreddit],
            similarity: (similarity * 100).toFixed(1) + '%'
          });
        }
      }
    }
    
    // Check for duplicate comments
    const allComments = posts.flatMap(p => 
      p.thread.map(c => ({ content: (c.content || '').toLowerCase(), subreddit: p.subreddit }))
    );
    
    for (let i = 0; i < allComments.length; i++) {
      for (let j = i + 1; j < allComments.length; j++) {
        const similarity = calculateSimilarity(allComments[i].content, allComments[j].content);
        if (similarity > 0.7) {
          issues.push({
            type: 'duplicate_comment',
            similarity: (similarity * 100).toFixed(1) + '%'
          });
        }
      }
    }
    
    // Check conversation depth
    posts.forEach((post, idx) => {
      if (post.thread.length < 2) {
        issues.push({ 
          type: 'shallow_conversation', 
          post: post.subreddit,
          comments: post.thread.length 
        });
      }
    });
    
    // Check subreddit-specific framing
    posts.forEach((post, idx) => {
      const context = subredditContext[post.subreddit];
      const terms = context.commonTerms.split(',').map(t => t.trim().toLowerCase());
      const hasTerminology = terms.some(term => 
        (post.body || '').toLowerCase().includes(term)
      );
      
      if (!hasTerminology) {
        issues.push({
          type: 'missing_subreddit_context',
          post: post.subreddit,
          message: 'Post lacks subreddit-specific terminology'
        });
      }
    });
    
    if (issues.length > 0) {
      console.warn('⚠️ Quality issues detected:', issues);
    }
    
    return posts;
  };

  // Calculate similarity between two strings
  const calculateSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  };

  // Calculate quality score
  const calculateAdvancedQualityScore = (posts) => {
    let score = 100;
    
    // Penalize duplicate content
    const postTexts = posts.map(p => (p.body || '').toLowerCase());
    for (let i = 0; i < postTexts.length; i++) {
      for (let j = i + 1; j < postTexts.length; j++) {
        const sim = calculateSimilarity(postTexts[i], postTexts[j]);
        if (sim > 0.5) score -= 30;
        if (sim > 0.7) score -= 20;
      }
    }
    
    // Reward conversation depth
    const avgThreadLength = posts.reduce((sum, p) => sum + p.thread.length, 0) / posts.length;
    if (avgThreadLength < 2) score -= 20;
    if (avgThreadLength >= 3) score += 10;
    
    // Check perspective diversity
    posts.forEach(post => {
      const uniquePerspectives = new Set(post.thread.map(c => 
        (c.content || '').substring(0, 40)
      )).size;
      if (uniquePerspectives < post.thread.length * 0.7) score -= 15;
    });
    
    // Check subreddit-specific framing
    const contextMatches = posts.filter(post => {
      const context = subredditContext[post.subreddit];
      const terms = context.commonTerms.split(',').map(t => t.trim().toLowerCase());
      return terms.some(term => (post.body || '').toLowerCase().includes(term));
    }).length;
    
    if (contextMatches < posts.length * 0.6) score -= 25;
    
    // Check product mention balance
    const productMentions = posts.reduce((sum, p) => 
      sum + p.thread.filter(c => c.mentionsProduct).length, 0
    );
    
    if (productMentions > posts.length * 0.5) score -= 20;
    if (productMentions === 0) score -= 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  // Run quality tests
  const runQualityTests = async () => {
    setTestResults({ status: 'running', tests: [] });
    
    const results = [];
    
    try {
      const testCalendar = calendars.length > 0 ? calendars[calendars.length - 1] : null;
      
      if (!testCalendar) {
        setTestResults({
          status: 'error',
          message: 'Generate a calendar first before running tests'
        });
        return;
      }
      
      // Test 1: No duplicate posts
      const postTexts = testCalendar.posts.map(p => (p.body || '').toLowerCase());
      let hasDuplicatePosts = false;
      for (let i = 0; i < postTexts.length; i++) {
        for (let j = i + 1; j < postTexts.length; j++) {
          if (calculateSimilarity(postTexts[i], postTexts[j]) > 0.6) {
            hasDuplicatePosts = true;
          }
        }
      }
      results.push({
        name: 'No Duplicate Posts',
        passed: !hasDuplicatePosts,
        detail: hasDuplicatePosts ? 'Found similar posts across subreddits' : 'All posts are unique'
      });
      
      // Test 2: Subreddit-specific framing
      const hasSubredditContext = testCalendar.posts.every(post => {
        const context = subredditContext[post.subreddit];
        const terms = context.commonTerms.split(',').map(t => t.trim().toLowerCase());
        return terms.some(term => (post.body || '').toLowerCase().includes(term));
      });
      results.push({
        name: 'Subreddit-Specific Framing',
        passed: hasSubredditContext,
        detail: hasSubredditContext ? 'All posts use subreddit terminology' : 'Some posts lack subreddit context'
      });
      
      // Test 3: Conversation depth
      const avgDepth = testCalendar.posts.reduce((sum, p) => sum + p.thread.length, 0) / testCalendar.posts.length;
      const goodDepth = avgDepth >= 2;
      results.push({
        name: 'Conversation Depth',
        passed: goodDepth,
        detail: `Average ${avgDepth.toFixed(1)} comments per post`
      });
      
      // Test 4: Product mention restraint
      const totalMentions = testCalendar.posts.reduce((sum, p) => 
        sum + p.thread.filter(c => c.mentionsProduct).length, 0
      );
      const mentionRate = totalMentions / testCalendar.posts.length;
      const goodMentionRate = mentionRate <= 0.5;
      results.push({
        name: 'Product Mention Restraint',
        passed: goodMentionRate,
        detail: `${totalMentions} mentions across ${testCalendar.posts.length} posts (${(mentionRate * 100).toFixed(0)}%)`
      });

      // Test 5: Persona weekly appearance limits
      const personaAppearances = {};
      testCalendar.posts.forEach(post => {
        post.thread.forEach(comment => {
          if (comment.personaId && comment.personaId !== 'op') {
            personaAppearances[comment.personaId] = (personaAppearances[comment.personaId] || 0) + 1;
          }
        });
      });
      const exceededLimit = Object.entries(personaAppearances).some(([id, count]) => count > 4);
      results.push({
        name: 'Persona Weekly Limits',
        passed: !exceededLimit,
        detail: exceededLimit ? 'Some personas appeared too frequently' : 'All personas within limits'
      });

      // Test 6: Thread depth control
      let threadDepthViolations = 0;
      testCalendar.posts.forEach(post => {
        const personaThreadCounts = {};
        post.thread.forEach(comment => {
          if (comment.personaId && comment.personaId !== 'op') {
            personaThreadCounts[comment.personaId] = (personaThreadCounts[comment.personaId] || 0) + 1;
          }
        });
        const violations = Object.values(personaThreadCounts).filter(count => count > 2).length;
        threadDepthViolations += violations;
      });
      results.push({
        name: 'Thread Depth Control',
        passed: threadDepthViolations === 0,
        detail: threadDepthViolations === 0 ? 'No persona exceeds 2 comments per thread' : `${threadDepthViolations} violations found`
      });
      
      setTestResults({ status: 'complete', tests: results });
    } catch (error) {
      setTestResults({
        status: 'error',
        message: error.message
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-lg">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  Reddit Mastermind
                  <Zap className="text-orange-500" size={20} />
                </h1>
                <p className="text-slate-600">LLM-Powered Content Calendar Generator</p>
              </div>
            </div>
            
            {qualityScore !== null && (
              <div className="text-right">
                <div className="text-sm text-slate-600">Quality Score</div>
                <div className={`text-3xl font-bold ${qualityScore >= 80 ? 'text-green-600' : qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {qualityScore}/100
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['configure', 'calendar', 'testing'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Configure Tab */}
        {activeTab === 'configure' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Company Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={config.companyInfo.name}
                    onChange={(e) => setConfig({
                      ...config,
                      companyInfo: { ...config.companyInfo, name: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={config.companyInfo.description}
                    onChange={(e) => setConfig({
                      ...config,
                      companyInfo: { ...config.companyInfo, description: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
                  <input
                    type="text"
                    value={config.companyInfo.targetAudience}
                    onChange={(e) => setConfig({
                      ...config,
                      companyInfo: { ...config.companyInfo, targetAudience: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Users size={20} />
                Personas ({config.personas.length})
              </h2>
              
              {/* Add Persona Form */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-medium text-slate-700 mb-3">Add New Persona</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Name (e.g., Sarah Chen)"
                    value={newPersona.name}
                    onChange={(e) => setNewPersona({...newPersona, name: e.target.value})}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g., Product Manager)"
                    value={newPersona.role}
                    onChange={(e) => setNewPersona({...newPersona, role: e.target.value})}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Background"
                    value={newPersona.background}
                    onChange={(e) => setNewPersona({...newPersona, background: e.target.value})}
                    className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Tone (e.g., Professional but approachable)"
                    value={newPersona.tone}
                    onChange={(e) => setNewPersona({...newPersona, tone: e.target.value})}
                    className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Expertise"
                    value={newPersona.expertise}
                    onChange={(e) => setNewPersona({...newPersona, expertise: e.target.value})}
                    className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Perspective"
                    value={newPersona.perspective}
                    onChange={(e) => setNewPersona({...newPersona, perspective: e.target.value})}
                    className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <div className="col-span-2 flex items-center gap-3">
                    <label className="text-sm text-slate-600">Product Mention Rate:</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={newPersona.mentionProduct}
                      onChange={(e) => setNewPersona({...newPersona, mentionProduct: parseFloat(e.target.value)})}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <span className="text-xs text-slate-500">(0.0 - 1.0)</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (newPersona.name && newPersona.role) {
                      setConfig({
                        ...config,
                        personas: [...config.personas, {
                          ...newPersona,
                          id: `p${config.personas.length + 1}`
                        }]
                      });
                      setNewPersona({
                        name: '', role: '', background: '', tone: '', expertise: '', perspective: '', mentionProduct: 0.15
                      });
                    }
                  }}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Add Persona
                </button>
              </div>
              
              {/* Existing Personas */}
              <div className="space-y-4">
                {config.personas.map((persona, idx) => (
                  <div key={persona.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-slate-800">{persona.name}</h4>
                        <p className="text-sm text-slate-600">{persona.role}</p>
                      </div>
                      <button
                        onClick={() => {
                          setConfig({
                            ...config,
                            personas: config.personas.filter((_, i) => i !== idx)
                          });
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">Background:</span>
                        <p className="text-slate-600">{persona.background}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Tone:</span>
                        <p className="text-slate-600">{persona.tone}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Expertise:</span>
                        <p className="text-slate-600">{persona.expertise}</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Mention Rate:</span>
                        <p className="text-slate-600">{(persona.mentionProduct * 100).toFixed(0)}%</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-slate-700">Perspective:</span>
                        <p className="text-slate-600">{persona.perspective}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Targeting</h2>
              
              {/* Subreddits */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Subreddits</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="e.g., r/productivity"
                    value={newSubreddit}
                    onChange={(e) => setNewSubreddit(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newSubreddit) {
                        setConfig({
                          ...config,
                          subreddits: [...config.subreddits, newSubreddit]
                        });
                        setNewSubreddit('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newSubreddit) {
                        setConfig({
                          ...config,
                          subreddits: [...config.subreddits, newSubreddit]
                        });
                        setNewSubreddit('');
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.subreddits.map((sr, idx) => (
                    <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium flex items-center gap-2">
                      {sr}
                      <button
                        onClick={() => {
                          setConfig({
                            ...config,
                            subreddits: config.subreddits.filter((_, i) => i !== idx)
                          });
                        }}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Query Topics */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Queries / Topics (used for content generation)</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="e.g., How do you create presentations quickly?"
                    value={newQuery}
                    onChange={(e) => setNewQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newQuery) {
                        setConfig({
                          ...config,
                          queries: [...config.queries, newQuery]
                        });
                        setNewQuery('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newQuery) {
                        setConfig({
                          ...config,
                          queries: [...config.queries, newQuery]
                        });
                        setNewQuery('');
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {config.queries.map((query, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-sm text-slate-700">{query}</span>
                      <button
                        onClick={() => {
                          setConfig({
                            ...config,
                            queries: config.queries.filter((_, i) => i !== idx)
                          });
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Posts Per Week */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Posts Per Week</label>
                <input
                  type="number"
                  value={config.postsPerWeek}
                  onChange={(e) => setConfig({ ...config, postsPerWeek: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                  className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Generate Calendar Button */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 text-center">
              <Zap size={48} className="mx-auto text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Generate Week {calendars.length + 1}</h2>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                LLM will generate unique, subreddit-specific posts with natural conversations. Each post is tailored to its community's culture and terminology.
              </p>
              
              <button
                onClick={() => generateContentCalendar(calendars.length + 1)}
                disabled={isGenerating}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2 shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Generate Calendar
                  </>
                )}
              </button>

              {calendars.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <CheckCircle size={20} />
                    <span className="font-medium">
                      {calendars.length} week{calendars.length > 1 ? 's' : ''} generated
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            {calendars.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-200 text-center">
                <Calendar size={64} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Calendars Generated</h3>
                <p className="text-slate-600 mb-6">Generate your first calendar to see it here.</p>
                <button
                  onClick={() => setActiveTab('configure')}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-all"
                >
                  Go to Configure
                </button>
              </div>
            ) : (
              calendars.map((calendar) => (
                <div key={calendar.week} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <h3 className="text-xl font-bold">Week {calendar.week}</h3>
                        <p className="text-orange-100 text-sm">
                          {calendar.posts.length} posts • Generated {new Date(calendar.generated).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm opacity-90">Quality</div>
                        <div className="text-3xl font-bold">{calendar.qualityScore}/100</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {calendar.posts.map((post, postIdx) => (
                      <div key={postIdx} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b border-slate-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                  {post.subreddit}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(post.scheduledTime).toLocaleString()}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-lg mb-2">
                                {post.title}
                              </h4>
                              <p className="text-slate-700 text-sm leading-relaxed">
                                {post.body}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-white space-y-3">
                          <div className="text-sm font-medium text-slate-600 mb-3">
                            Comments ({post.thread.length})
                          </div>
                          {post.thread.map((comment, commentIdx) => (
                            <div
                              key={commentIdx}
                              className={`p-3 rounded-lg ${
                                comment.isOPReply 
                                  ? 'ml-6 bg-purple-50 border border-purple-200'
                                  : comment.isReply
                                  ? 'ml-6 bg-slate-50 border border-slate-200'
                                  : comment.isFollowUp 
                                  ? 'ml-6 bg-slate-50 border border-slate-200' 
                                  : 'bg-blue-50 border border-blue-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-slate-800 text-sm">
                                  {comment.persona}
                                  {comment.isOPReply && (
                                    <span className="ml-2 px-2 py-0.5 bg-purple-200 text-purple-700 rounded text-xs font-medium">
                                      OP
                                    </span>
                                  )}
                                  {comment.replyingTo && (
                                    <span className="ml-2 text-xs text-slate-500">
                                      → replying to {comment.replyingTo}
                                    </span>
                                  )}
                                </span>
                                <div className="flex items-center gap-2">
                                  {comment.mentionsProduct && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                      Product
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-500">
                                    +{comment.delay}h
                                  </span>
                                </div>
                              </div>
                              <p className="text-slate-700 text-sm leading-relaxed">
                                {comment.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Testing Tab */}
        {activeTab === 'testing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Quality Tests</h2>
              <p className="text-slate-600 mb-6">
                Run tests on the most recent calendar to validate quality.
              </p>
              
              <button
                onClick={runQualityTests}
                disabled={testResults?.status === 'running' || calendars.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
              >
                {testResults?.status === 'running' ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Run Tests
                  </>
                )}
              </button>

              {calendars.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">Generate a calendar first</p>
              )}
            </div>

            {testResults?.status === 'complete' && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Results</h3>
                <div className="space-y-3">
                  {testResults.tests.map((test, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-2 ${
                        test.passed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {test.passed ? (
                            <CheckCircle className="text-green-600" size={24} />
                          ) : (
                            <XCircle className="text-red-600" size={24} />
                          )}
                          <div>
                            <div className="font-medium text-slate-800">{test.name}</div>
                            <div className="text-sm text-slate-600 mt-1">{test.detail}</div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            test.passed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {test.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {testResults?.status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{testResults.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RedditMastermind;