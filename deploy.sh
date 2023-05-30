#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

if [ -d "$DIR/node_modules" ] 
then
    echo "npm install has already ran, skipping" 
else
  cd $DIR
  npm install
fi

export root=/home/node-dns
rm -rf $root
mkdir -p $root
cp -r $DIR/* $root

systemctl stop node-dns
cat $DIR/node-dns.service | envsubst > /etc/systemd/system/node-dns.service
systemctl daemon-reload
systemctl start node-dns
systemctl enable node-dns


sudo chown -R public:public $root


cat $DIR/readme.md
echo ""

journalctl -u node-dns --no-pager -f
