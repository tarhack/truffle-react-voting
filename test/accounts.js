/**
 * Test avec une nouvelle instance du contrat
 */
const voting = artifacts.require("Voting");
const chalk = require('chalk');

contract("Voting", accounts => {
  let contract ;
  it("List All my accounts", async () => {
    contract = await voting.deployed();
    console.log('Contract address is :'+chalk.blue(contract.address));
    console.log(chalk.blue('Owner account : '+accounts[0]));

    for(idx=0;idx<accounts.length;idx++){
        console.log('Account ['+idx+'] :'+accounts[idx]);
    }
  })
  
  it("Should have the entire proposal array", async () => {
    const proposals = await contract.getAllProposals.call();
    console.log('Total proposals :'+proposals.length);
    for(p of proposals){
        console.log('Proposal ['+p.index+'] : '+web3.utils.hexToUtf8(p.description)+'  total votes :'+p.voteCount);
    }
  });
});