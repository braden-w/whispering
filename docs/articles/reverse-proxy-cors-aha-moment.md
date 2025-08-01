# The Day I Finally Understood Reverse Proxies

I was trying to connect a web app to a local server exposed through ngrok. Simple, right? The server was running, I had the URL, authentication was working. Should just work.

Nope. CORS error.

```
Access to fetch at 'https://abc123.ngrok.io/api' from origin 'https://myapp.com' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

Here's the thing that took me too long to realize: the browser is trying to protect users. When JavaScript on myapp.com tries to fetch data from abc123.ngrok.io, the browser asks ngrok.io "Hey, is myapp.com allowed to access you?" And when ngrok.io doesn't respond with the right headers, the browser blocks it.

But here's where it gets interesting. Servers don't have this restriction. A server can call any other server. No CORS. No questions asked.

That's when it clicked.

## What a Reverse Proxy Actually Does

A reverse proxy is just a middleman server. That's it. When your browser can't talk to a server directly, you talk to your own server, and it talks to the other server for you.

```
❌ Browser → Different Domain (blocked by CORS)
✅ Browser → Your Server → Different Domain (no CORS between servers)
```

A basic implementation can be embarrassingly simple:

```javascript
app.get('/proxy/:url', async (req, res) => {
  const response = await fetch(req.params.url);
  res.header('Access-Control-Allow-Origin', '*');  // You control these headers now!
  res.send(await response.text());
});
```

The browser asks YOUR server "can I access you?" and you say yes. Then your server fetches from the external server (no CORS check there), and passes the data back.

## The Lesson

You can't bypass CORS from the browser side.

The only solutions are:
1. The server adds CORS headers (you need control of the server)
2. You proxy through your own server (what everyone actually does)

Every service that connects to third-party APIs runs proxy servers. Zapier, IFTTT, any integration platform. They're all just middlemen servers that:
- Receive requests from browsers (with CORS headers)
- Forward them to external APIs (no CORS between servers)  
- Pass responses back (with CORS headers)

That's it. No magic. Just servers talking to servers because browsers can't.

For more complex scenarios involving streaming data or Server-Sent Events, tools like Caddy or custom Node.js proxies handle the additional complexity. But the core concept remains the same: a middleman that speaks both languages.

Sometimes the simple solution is right there. You just need to understand why it exists.