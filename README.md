# Click Studio — Event Photobooth System

A browser-based photo capture and gallery system for events — no app install required.

**Live demo:** [cli-studiodev.vercel.app](https://cli-studiodev.vercel.app/)

## Problem

Event photobooths need a fast, no-login way for guests to capture and share photos without staff intervention. Traditional setups require a dedicated operator and expensive hardware.

## What it does

- Guests scan a QR code and start shooting in seconds
- Photo filters and effects
- Gallery view with shareable sessions
- No accounts, no app install

## Tech Stack

React · Node.js · Tailwind CSS

## Key Decisions

Built anonymous, session-based access instead of requiring accounts — guests at an event won't sign up for anything, so removing that friction was the actual product requirement.

## Setup

```bash
git clone https://github.com/sainttlaurel/CLICK-STUDIO.git
cd CLICK-STUDIO
npm install
npm run dev
```
```
