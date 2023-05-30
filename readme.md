# template

npm init vue@latest // yes: router, jsx, typescript, unit test, eslint, prettier
npm install --save-dev nodemon rimraf ts-node zip-build

make template.tgz: npm pack --pack-destination dist
untar: tar zxf {template}.tgz

# prod build

npm run build

builds client package
builds server package
server will serve static files from client packge when run, keep files in relative to each other

## to actually depoy server

unzip dist/{app}.zip to folder accessible by service runner
use os service/process management to start, pass port number to startup cmd
node ./server/server.js {port}

# dev env

npm run dev

vite will run as usual from port 5173
server will start on port 300
vite will proxy all calls starting with /srv to server
