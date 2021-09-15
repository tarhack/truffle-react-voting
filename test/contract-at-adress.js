/**
 * Test avec une instance d'un contrat déjà déployé et utilisé
 */
const Voting = artifacts.require("Voting");
const chalk = require('chalk');

const caddress = '0x92507d19737ea07f485bBFfFb7312E118503a5Ba' ;

contract("Voting", accounts => {
    let contract;
    before(async () => {
        contract = await Voting.at(caddress);
    });

    it('Contract should be deployed', async () => {
        assert.ok(contract, 'Contract should be deployed');
        console.log('Contract address is :'+chalk.green(contract.address));
    });

    it('Should see the contract status', async () => {
        const status = await contract.status.call();
        console.log('Contract Status :'+status);
    });

    it('Should see all proposals', async () => {
        const proposals = await contract.getAllProposals.call();
        console.log('Total proposals :'+proposals.length);
        for(p of proposals){
            console.log('Proposal ['+p.index+'] : '+web3.utils.hexToUtf8(p.description)+'  total votes :'+p.voteCount);
        }
    });

});

