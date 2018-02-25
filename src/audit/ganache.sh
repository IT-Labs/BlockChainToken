#! bin/bash

kill $( lsof -i:8545 -t )

ganache-cli -a 100 -s "Caerus" &

sleep 2

truffle migrate --reset

truffle exec ./balance.js > output.txt

truffle exec ./presale.js >> output.txt

truffle exec ./balance.js >> output.txt

read  -n 1

kill $( lsof -i:8545 -t )
