#! bin/bash

kill $( lsof -i:8545 -t )

ganache-cli -a 100 -s "Caerus" > /dev/null & 

# remove truffle cache
rm ../build -rf

sleep 2
echo "migrating contracts..."
truffle migrate --reset > /dev/null
echo "__________________________Initial State__________________________" > output.txt
truffle exec ./balance.js >> output.txt

# Empty multisig wallet that will be receiving ether
# truffle exec ./emptywallet.js

echo "executing presale methods..."
echo "__________________________Presale__________________________" >> output.txt
truffle exec ./presale.js >> output.txt
truffle exec ./balance.js >> output.txt

echo "executing discounts methods..."
echo "__________________________Adding Discounts__________________________" >> output.txt
truffle exec ./discounts.js >> output.txt

echo "executing crowdsale methods..."
echo "__________________________Executing Crowdsale__________________________" >> output.txt
truffle exec ./crowdsale.js >> output.txt
truffle exec ./balance.js >> output.txt

echo "executing vesting methods..."
echo "__________________________ Vesting _________________________________" >> output.txt
truffle exec ./vesting.js >> output.txt

echo "results reported to output.txt"

echo "exiting"
kill $( lsof -i:8545 -t )
