const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Minified widget code
  const widgetCode = `
window.PersonaChat={init:function(e){const t=document.getElementById(e.container);if(!t)return;const n=document.createElement("div");n.style.cssText="position:fixed;bottom:20px;right:20px;width:350px;height:600px;background:white;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;",t.appendChild(n);const s=document.createElement("div");s.style.cssText="padding:16px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;",n.appendChild(s);const i=document.createElement("h3");i.style.cssText="margin:0;font-size:16px;color:#111827;",i.textContent="Chat",s.appendChild(i);const o=document.createElement("button");o.style.cssText="background:none;border:none;cursor:pointer;padding:4px;",o.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',s.appendChild(o);const a=document.createElement("div");a.style.cssText="flex:1;overflow-y:auto;padding:16px;",n.appendChild(a);const d=document.createElement("form");d.style.cssText="padding:16px;border-top:1px solid #e5e7eb;display:flex;gap:8px;",n.appendChild(d);const l=document.createElement("input");l.type="text",l.placeholder="Type your message...",l.style.cssText="flex:1;padding:8px 12px;border:1px solid #e5e7eb;border-radius:6px;font-size:14px;",d.appendChild(l);const c=document.createElement("button");c.type="submit",c.style.cssText="background:#2563eb;color:white;border:none;border-radius:6px;padding:8px 16px;font-size:14px;cursor:pointer;",c.textContent="Send",d.appendChild(c);let r=!1;function p(e,t){const n=document.createElement("div");n.style.cssText=t?"margin:8px 0;text-align:right":"margin:8px 0";const s=document.createElement("div");s.style.cssText=t?"background:#2563eb;color:white;border-radius:12px;padding:8px 12px;display:inline-block;max-width:80%;word-wrap:break-word":"background:#f3f4f6;color:#111827;border-radius:12px;padding:8px 12px;display:inline-block;max-width:80%;word-wrap:break-word",s.textContent=e,n.appendChild(s),a.appendChild(n),a.scrollTop=a.scrollHeight}d.onsubmit=async function(t){if(t.preventDefault(),r||!l.value.trim())return;r=!0,p(l.value.trim(),!0);const n=l.value.trim();l.value="",c.disabled=!0;try{const t=await fetch(e.apiUrl+"/chat",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+e.apiKey},body:JSON.stringify({messages:[{role:"user",content:n}],personaId:e.personaId,personality:["helpful"],knowledge:["general"],tone:"friendly",userId:"anonymous",tokensNeeded:100})});if(!t.ok)throw new Error("Failed to get response");const s=await t.json();p(s.message,!1)}catch(e){p("Sorry, I encountered an error. Please try again.",!1)}r=!1,c.disabled=!1},o.onclick=function(){n.remove()}}};
`;

  return new Response(
    widgetCode,
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=31536000'
      }
    }
  );
});