# Node DNS
Simple way to log and control your DNS calls.  The web page allows controlling client's access.  I use this as parental control, so i can block individual clients.  
Of course went the kids are smart enough to circumvent this, then I have done my job properly.

---
## Port 53 issue
you will not that linux itself takes port 53 for systemd-resolve,  you can get around this issue by binding on external interface, ie. 192.168.2.100:53 instead of default which is 0.0.0.0:53

---
## PROD build
npm run build

builds client package
builds server package
server will serve static files from client packge when run, keep files in relative to each other

---
## DEV env
npm run dev

vite will run as usual from port 5173
server will start on port 300
vite will proxy all calls starting with /srv to server

