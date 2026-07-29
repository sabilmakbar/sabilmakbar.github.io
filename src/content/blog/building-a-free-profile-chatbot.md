---
title: "How I built a profile chatbot for free"
date: 2026-07-29
summary: "A small chatbot that answers questions about me, built on free infrastructure and open models, and the one rule that made it trustworthy."
tags: ["RAG", "NLP", "Cloudflare", "Astro"]
repo: "sabilmakbar/sabilmakbar.github.io"
draft: true
---

A CV is a wall of text, and I have never met anyone who reads one closely.
People skim, land on a keyword, and form a quick impression. I wanted something
different on my own site. Instead of asking visitors to dig through pages, I
wanted them to just ask a question and get a straight answer. That is where the
little "Ask about me" button in the corner came from, and the surprising part is
that building it cost me nothing.

The idea is simple once you say it out loud. I take my profile, break it into
small pieces, and when someone asks something I pull out the pieces that matter
and hand them to a language model. The model gets one firm rule along with them:
answer only from what I give you, and if you do not know, say so. That rule is
the whole game. I did not want a charming assistant that invents a plausible
history for me. I wanted one that would rather admit it does not know than make
something up. Ask it for my phone number and it politely declines, because that
detail was never in the data in the first place.

The part I expected to fight with was cost, since hosting models usually means a
monthly bill. I found my way around that with Cloudflare's Workers AI, which
runs open models on a generous free tier. The same little program that serves an
answer also does the embedding and the generation, so there is no external
service to pay for and no key to guard. I leaned on an open embedding model to
understand the meaning of a question and a small Llama model to write the reply.

Then it taught me a lesson about time. Early on I asked it how many years of
experience I had, and it gave me a confident, wrong number that would quietly
rot as the months passed. The fix was almost embarrassing in its simplicity: I
started telling the model today's date with every question, and let it do the
arithmetic from when my career actually began. Now the answer ages on its own,
and I never have to remember to update it.

The habit I am proudest of is that the chatbot and the rest of the site drink
from the same well. Every fact it knows comes from the exact data files that
render my pages. I change a role in one place, run a single command, and both
the page and the chatbot agree. Nothing private lives in those files, so nothing
private can ever slip into an answer. The safety comes from what I leave out, not
from some filter bolted on afterward.

These days I quietly log the questions people ask, with no names or addresses
attached, just the questions themselves. They are the most honest feedback I
get. They tell me what I explained badly, what people actually care about, and,
more often than not, what I should write about next. This note is the first of
those.
