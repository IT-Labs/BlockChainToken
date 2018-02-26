#! bin/bash

kill $( lsof -i:8545 -t )

ganache-cli -a 100 -s "Caerus" &

# remove truffle cache
rm ../build -rf

sleep 2

truffle migrate --reset
echo "__________________________Initial State__________________________" > output.txt
truffle exec ./balance.js >> output.txt

echo "__________________________Presale__________________________" >> output.txt
truffle exec ./presale.js >> output.txt
truffle exec ./balance.js >> output.txt


echo "__________________________Adding Discounts__________________________" >> output.txt
truffle exec ./discounts.js >> output.txt

echo "__________________________Executing Crowdsale__________________________" >> output.txt
truffle exec ./crowdsale.js >> output.txt
truffle exec ./balance.js >> output.txt

read  -n 1

kill $( lsof -i:8545 -t )
