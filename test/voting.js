const voting = artifacts.require("Voting");
const chalk = require('chalk');

/**
 *  enum WorkflowStatus {
            RegisteringVoters,
            ProposalsRegistrationStarted,
            ProposalsRegistrationEnded,
            VotingSessionStarted,
            VotingSessionEnded,
            VotesTallied
    }
 */

contract("Voting", accounts => {
  it("Should regiter Voters", async () => {
    const contract = await voting.deployed();

    console.log(chalk.blue('Contract Address : '+contract.address));

    console.log(chalk.blue('Owner account : '+accounts[0]));

    for(idx=0;idx<accounts.length;idx++){
        console.log('Account ['+idx+'] :'+accounts[idx]);
    }

    await contract.register(accounts[0], { from: accounts[0] }); // Owner

    await contract.register(accounts[1], { from: accounts[1] });
    await contract.register(accounts[2], { from: accounts[2] });
    await contract.register(accounts[3], { from: accounts[3] });
    await contract.register(accounts[4], { from: accounts[4] });
    await contract.register(accounts[5], { from: accounts[5] });
    await contract.register(accounts[6], { from: accounts[6] });

    // Get Last Voters Index => must be 7
    const storedData = await contract.lastVoterIndex.call();

    assert.equal(storedData, 7, "The value 7 is not last voter index.");
  });

  it("should change state to ProposalsRegistrationStarted - status 1", async () => {
    const contract = await voting.deployed();
    await contract.changeState({ from: accounts[0] });

    const returns = await contract.status.call();
    assert.equal(returns, 1, "Next status MUST be : 1 - ProposalsRegistrationStarted");

  });

  it("Should add proposal if registered", async () => {
    const contract = await voting.deployed();
    await contract.addProposal('Transports gratuits sur tout le territoire', { from: accounts[1] });

    let returns = await contract.getLastProposalId.call();
    assert.equal(returns, 1, "Last proposal ID must be 1 after the first addProposal");

    await contract.addProposal('Dix semaines de congés payés', { from: accounts[2] });
    await contract.addProposal('Retraite à 50 ans', { from: accounts[3] });

    returns = await contract.getLastProposalId.call();
    assert.equal(returns, 3, "Last proposal ID must be 3 after the first addProposal");
    console.log('Last proposition ID :'+chalk.blue(returns));
  });

  it("should change state to ProposalsRegistrationEnded - status 2", async () => {
    const contract = await voting.deployed();
    await contract.changeState({ from: accounts[0] });

    const returns = await contract.status.call();
    assert.equal(returns, 2, "Next status MUST be : 2 - ProposalsRegistrationEnded");

  });

  it("Should change state to VotingSessionStarted - status 3", async () => {
    const contract = await voting.deployed();
    await contract.changeState({ from: accounts[0] });

    const returns = await contract.status.call();
    assert.equal(returns, 3, "Next status MUST be : 3 - VotingSessionStarted");

  });

  it("Should Vote if registered", async () => {
    const contract = await voting.deployed();
    let idx = 0;
    let p0 = 0;
    let p1 = 0;

    for(idx=0;idx<=6;idx++){
      if ( idx % 2 == 0){
        await contract.vote(0, { from: accounts[idx] });
        p0++;
      }else{
        await contract.vote(1, { from: accounts[idx] });
        p1++
      }
    }

    console.log('vote for proposition 0 :'+chalk.blue(p0));
    console.log('vote for proposition 1 :'+chalk.blue(p1));

  });

  it("Should change state to VotingSessionEnded - status 4", async () => {
    const contract = await voting.deployed();
    await contract.changeState({ from: accounts[0] });

    const returns = await contract.status.call();
    assert.equal(returns, 4, "Next status MUST be : 4 - VotingSessionEnded");
  });

  it("Should change state to VotesTallied - status 5", async () => {
    const contract = await voting.deployed();
    await contract.changeState({ from: accounts[0] });

    const returns = await contract.status.call();
    assert.equal(returns, 5, "Next status MUST be : 5 - VotesTallied");

    console.log(chalk.blue('this change of state starts the calculation of the votes'));
  });

  it("Should have the winner", async () => {
    const contract = await voting.deployed();
    const returns = await contract.getWinningProposal.call();
    assert.equal(returns, 0, "The Winner on this TESTS scenario MUST be proposal 0");

    console.log(chalk.blue('Proposal :'+returns+' Winn !!!'));
  });

  it("Should have the entire proposal array", async () => {
    const contract = await voting.deployed();
    const returns = await contract.getAllProposals.call();
    
    console.log('All proposals :'+returns);

  });
});
