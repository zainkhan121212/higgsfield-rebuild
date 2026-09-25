# Walkthrough script (under 5 minutes, camera on)

Open the site in an incognito window so it looks the way a reviewer sees it.

- Live: https://higgsfield-rebuild-delta.vercel.app
- Repo: https://github.com/zainkhan121212/higgsfield-rebuild

Two videos are needed this round:
1. this product walkthrough, camera on, under 5 minutes
2. a separate **1-minute intro about you** — something that is not on your CV

---

## 0:00 — What this is (25s)

"This is Frameline. I built it in a day as a rebuild of an AI video and image
studio, and then the brief changed: keep the idea and the backend, bring your
own front end. So the clone is gone — the backend is the same real one, and
everything you're looking at is my design."

## 0:25 — The hero (40s)

Move the cursor slowly through the figure.

"This is the whole product in one object. That's a woman pouring water, and
she's made out of the sentence that generated her — the image is sampled to a
grid and each cell prints one character of the prompt at that pixel's darkness.
Move through her and the writing scatters, then it settles back.

It's a canvas, and it's careful: one font for the whole canvas because setting
it per glyph cost me two thirds of the frame rate, colours batched into buckets,
and the loop parks itself when nothing is moving. If you've asked your system
for reduced motion, it draws once and never animates."

## 1:05 — The design (35s)

Scroll slowly through the home page.

"Paper, ink, hairline rules, figure numbers in the margin, one red accent. Every
competitor in this space is neon on black — this is the opposite room, and it's
the honest shape of the product, because what you actually do here is write.

The whole palette is tokens in one stylesheet, which is how the entire app moved
from dark to paper in a single pass.

These are Plates — the last nine public generations straight out of Postgres,
each captioned with the prompt that made it. Nothing on this page is a mockup."

## 1:40 — The one number (20s)

Stop on the black band.

"This is the product decision I'd defend hardest. On the site I rebuilt, a free
account cannot generate — every Generate press opens a paywall. I tried it.
Here every visitor gets 100 real credits and can generate in the first ten
seconds. That number at the end is live: it's how many pictures this database
has actually made."

## 2:00 — Image studio (55s)

Click Image → a suggestion → point at the cost on the button → open the model
picker → Generate.

"One prompt box, thirty models, and the cost is printed on the button before you
press it. This is a real generation — FLUX on fal, a few seconds. Credits go
down live. Favourite it, download it, or copy a public link anyone can open."

## 2:55 — Video + preview before you pay (60s)

Click Video → Change → pick a preset → Preview frames ✦1.

"A video costs 45 credits. Instead of guessing, I spend one credit and get four
stills of that shot, pick the frame I want, and that frame becomes the video's
first frame."

Pick one → Generate.

"Honest label: video models are simulated in this build. The credits, the queue
and the history are real, the clip is a sample, and the app says so on every
video card. No free text-to-video API fit the budget, and I'd rather say that
than let you find out."

## 3:55 — Account, index, checkout (40s)

Open the Index. "Every secondary page still exists — sixteen of them — but as a
table of contents instead of a sixteen-item rail across the top."

Sign up. "Signing up upgrades the guest account in place, so nothing is lost.
Login also does passkeys — Face ID, Windows Hello, nothing to steal."

Pricing → Get Pro. "Real steps: review, card form, processing, receipt with an
order number. Test card, nothing charged, card details never leave the browser."

## 4:35 — Close (20s)

"Under the hood: Next.js with server components, Postgres through Prisma, fal
for images, Vercel. Security is written up in docs/SECURITY.md — passkeys,
signed sessions, cross-site request blocking at the edge, strict CSP, rate
limits, and a cap on free accounts per IP so nobody farms credits. The design
reasoning is in docs/DESIGN.md, and every prompt I gave the agent is committed
in .agent-logs. Thanks."

Stop at ~4:55.

---

## The 1-minute intro video

Not a CV summary. One specific thing about you that a reviewer could not read on
paper. A structure that works:

- 0:00–0:10 — name, where you are, one sentence on what you do
- 0:10–0:45 — **the thing that isn't on the CV**: something you taught yourself
  for no reason, something you built that failed, a hobby that shows how you
  think, the moment you got hooked on this work
- 0:45–1:00 — why this trial, in your own words, not the job ad's

Record it on a phone in one take, look at the lens, don't script it word for
word. Upload to Loom or Google Drive and set link sharing to **anyone with the
link**, then paste that link into the assignment form.
