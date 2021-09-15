
import React, { Component } from "react";
import VotingContract from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import chalk from 'chalk';

import { Button, Form, Card, ListGroup, Table  } from 'react-bootstrap'

import ComboSelect from 'react-combo-select';
import '../node_modules/react-combo-select/style.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

import WinnerWindow from './WinnerWindow' ;

import "./App.css";

import logo from './images/solidity-logo.png';

const contract_states = {
  0 : 'RegisteringVoters',
  1 : 'ProposalsRegistrationStarted',
  2 : 'ProposalsRegistrationEnded',
  3 : 'VotingSessionStarted',
  4 : 'VotingSessionEnded',
  5 : 'VotesTallied'
} ;


class App extends Component {
    state = { address: 0, 
            registred : false, 
            hasVoted : false,
            proposalId : null,
            owner : false, 
            web3: null, 
            accounts: null, 
            contract: null, 
            status : 0 ,
            proposals : null,
            error: {name:null},
            deleted : {},
            contract_status : [
              { value:'0' , text : 'RegisteringVoters'},
              { value:'1' , text : 'ProposalsRegistrationStarted'},
              { value:'2' , text : 'ProposalsRegistrationEnded'},
              { value:'3' , text : 'VotingSessionStarted' },
              { value:'4' , text : 'VotingSessionEnded'},
              { value:'5' , text : 'VotesTallied'}
            ],
            revert_state : null,
            winning : {
              index : null,
              description : null
            },
            showWinner : true
          };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = VotingContract.networks[networkId];
      const instance = new web3.eth.Contract(
        VotingContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.getInfos);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  componentWillUnmount = async () => {
    const { web3 } = this.state;
    console.log('componentWillUnmount called...')
    web3.eth.clearSubscriptions()
  }

  getInfos = async () => {
    const { accounts, contract } = this.state;
    console.log('Account Address :' + chalk.blue(accounts[0]));
    // Call contract for account is registred or not
    const response = await contract.methods.isRegistred(accounts[0]).call();
    // Call contract for account has voted or not
    const result = await contract.methods.hasVoted(accounts[0]).call();
    const voted = result[0] ;
    const proposalId = result[1] ;
    console.log('Has voted :' + voted +' ProposalId :'+proposalId);
    // Call contract to inquire for status
    const state = await contract.methods.status().call();
    // Update state with the result.
    this.setState({ address: accounts[0] , registred : response , hasVoted : voted, proposalId: proposalId, status : state, revert_state : state });
    this.isOwner();
    this.getProposals();
    this.getWinningProposal();
  };


  waitForAnyProposals = async () =>{
    const { contract, web3 } = this.state;
    web3.eth.subscribe('logs', {   
      address: contract.options.address,
      topics: ['0x0000000000000000000000000000000000000000']
    }, function(error, result){
        if (!error)
            console.log('Error Suscribre >>>>>>>>>>'+result);
    })
    .on("connected", function(subscriptionId){
      console.log(subscriptionId);
    })
    .on("data", function(log){
        console.log('A change is made : '+log);
    })
    .on("changed", function(log){
    });

  }

  waitForEvent = async (EventName) =>{
    const { contract } = this.state;
    let options = {
      filter: {
          value: [],
      },
      fromBlock: 0
    };

    if ( contract ){
        let fn = eval("contract.events."+EventName);
        console.log(chalk.green('Call function :'+fn))
    
        fn(options)
        .on('data', event => {
          console.log(chalk.green('Registration event : '+event.returnValues));
          this.getInfos();
        })
        .on('changed', changed => console.log(changed))
        .on('error', err => console.log(chalk.red('<<<<ERROR>>>>'+err)))
        .on('connected', id => console.log(id))
    }
  }

  register = async() => {
    const { address, accounts, contract} = this.state;
    this.setState({msgErr:null})
    console.log('Register ADDRESS :'+chalk.blue(address)+' to Contract Address :'+chalk.blue(contract));
    if ( address !== '' ){           
      // Enregistrement du votant 
      await contract.methods.register(address).send({from: accounts[0]})
      .catch(err => {this.setState({msgErr:err.message});console.log('>>>>>>>>>'+err.message)})
    }else{
      this.setState({msgErr:'Enter a valid account'})
    }
    await this.waitForEvent('VoterRegistered');
    await this.waitForEvent('ProposalsRegistrationStarted');
  }

  isOwner = async() => {
    const { address, contract} = this.state;
    this.setState({msgErr:null})
    console.log('Register ADDRESS :'+chalk.blue(address)+' to Contract Address :'+chalk.blue(contract));
    let addr = false;
    if ( address !== '' ){           
      // Enregistrement du votant 
      addr = await contract.methods.owner().call()
      .catch(err => {this.setState({msgErr:err.message});console.log('>>>>>>>>>'+err.message)})
    }else{
      this.setState({msgErr:'Enter a valid account'})
    }
    this.setState({ owner: addr === address })
  }

  changeState = async() => {
    const { address, contract, status} = this.state;
    let new_status = + status + 1
    console.log('Change State :'+status+' -> '+contract_states[status]+' ->'+contract_states[new_status])

    await contract.methods.changeState().send({from: address})
    .then(() => this.waitForEvent(contract_states[new_status]))
    .catch(err => {this.setState({msgErr:err.message});console.log('>>>>>>>>>'+err.message)})
  }

  getProposals = async () => {
    const { contract, status } = this.state;
    console.log(chalk.blue('<<<Proposals>>> status:'+status));
    if ( status >= 1 ){
      let p = await contract.methods.getAllProposals().call();
      this.setState({proposals : p});
      console.log(chalk.blue('Proposals :'+p+' l:'+p.length));
    }
  }

  getWinningProposal = async () => {
    const { contract, status, web3 } = this.state;
    if ( status === '5' ){
      console.log(chalk.blue('<<<Winning proposal>>> '+status));
      let p = await contract.methods.getWinningProposal().call();
      p.description = web3.utils.isHex(p.description)?web3.utils.hexToUtf8(p.description):p.description;
      this.setState({winning : p, showWinner : true});
      console.log(chalk.blue('Winning Proposals :'+p.index+' l:'+p.description));
    }
  }

  renderTableData() {
    const {status, web3, hasVoted} = this.state;

    const handleChange = e => {
      console.log('Set  :'+e.target.value+' to:'+e.target.checked);
    }

    return this.state.proposals.map((proposal, id) => {
       const { index, description } = proposal 
       return (
          <tr key={id}>
             <td>{index}</td>
             <td>{web3.utils.isHex(description)?web3.utils.hexToUtf8(description):description}</td>
             { status === '3' && ! hasVoted &&
              <td>
                <input type="radio" name="choices" onChange={handleChange} value={index} />
              </td>
             }
              { status >= '3' && hasVoted &&
              <td>
                <input type="radio" name="choices" onChange={handleChange} value={index} checked={this.state.proposalId === index }/>
              </td>
             }
          </tr>
       )
    })
  }

  addProposal = async () => {
    const { contract, address, proposal, web3 } = this.state;
    console.log(chalk.blue('Proposal creation:'+proposal));
    if ( proposal ){
      await contract.methods.addProposal(web3.utils.utf8ToHex(proposal)).send({from: address})
      .catch(err => {this.setState({msgErr:err.message});console.log(chalk.red('>>>>>>>>>'+err.message))})
      this.waitForEvent('ProposalRegistered');
      this.waitForAnyProposals();
    }
  }

  voteForProposal = async (id) => {
    const { contract, address } = this.state;
    console.log(chalk.blue('Vote for id :'+id));
      await contract.methods.vote(id).send({from: address})
      .catch(err => {this.setState({msgErr:err.message});console.log(chalk.red('>>>>>>>>>'+err.message))})
      this.waitForEvent('Voted');
      this.waitForEvent('VotesTallied');
  }

  revertToState = async () => {
    const { contract, address, revert_state} = this.state;
    console.log(chalk.blue('Revert to State ID : '+revert_state))
    if ( revert_state ){
        await contract.methods.revertState(revert_state).send({from: address})
        .catch(err => {
            this.setState({msgErr:err.message});
            console.log(chalk.red('>>>>>>>>>'+err.message))}
        )
        this.waitForEvent('WorkflowStatusChange')
    }else{
      console.log(chalk.red('NO Revert because no revert_state ...'))
    }
  }
  /**
   * Création de la nouvelle proposition
   * @param : event 
   */
  onFormSubmit = event => {
    event.preventDefault();
    console.log("Form validation ..."+this.state.proposal);
    this.addProposal();
  };

  /**
   * Création de la nouvelle proposition
   * @param {*} event 
   */
     voteFormSubmit = event => {
      event.preventDefault();
      console.log("Vote Form Submition");
      let choices = document.getElementsByName("choices");
      console.log('Votes choices  : '+choices.length);
      let id ;
      for (let choice of choices) {
        if ( choice.checked )
            id = choice.value 
      }
      
      if ( id ){
        console.log('Proposition Id : '+id)
        this.voteForProposal(id);
      }else{
        console.log('No Id, No validation call...')
      }
    };

/**
 * Validation du champs de saisie nouvelle proposition : proposal
 * 
 * @param  : event 
 */
  formObject = event => {
    event.preventDefault();
    const { name, value } = event.target;
    let error = { ...this.state.error };
    // console.log('Name is :'+name+' value:'+value);
    switch (name) {
      case "proposal":
          error.name = value.length < 5 ? "Name should be 5 characaters long" : "";
          break;
      default:
          break;
    }
    this.setState({
      error,
      [name]: value
    })
  }

  handleChange = (event) => { 
    console.log('set revert state to :'+event);
    this.setState({ revert_state : event }); 
  }

  handleSubmit = (event) => {
    event.preventDefault();
    console.log('handleSubmit form revert :'+this.state.revert_state);
    this.revertToState();
  }

  comboChange = (event) => {
    console.log('Name is :'+event);
    this.setState({revert_state : event});
  }

  changeWinnerShow = () => {  
    this.setState({showWinner:true});
    console.log('Winner Visible ? :'+this.state.showWinner);
  }

  render() {
    const { status, error, registred, hasVoted, contract_status } = this.state;

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    const comboStates = <ComboSelect data={contract_status} sort="number" onChange={this.handleChange} value={this.state.revert_state} /> ;

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    let intro ;
    if ( registred ){
      intro = <p>Your Are registred</p>  ;
    } else {
      intro = 
      <div>
        <p> 
          Your Are NOT registred 
        </p>
        <Button style={{marginRight : '1em', marginBottom : '1em'}} onClick={ this.register } variant="dark" > Register </Button>

      </div>
      ;
    }

    let voted ;
    if ( hasVoted ){
      voted = <span><p>You have voted </p></span>  ;
    }

   const admin =  this.state.owner ;
   let changeStateButton ;

    if ( admin ){
      changeStateButton = <Button style={{marginRight : '1em'}} onClick={ this.changeState } variant="dark" > Change State </Button> ;
    }
   
    let winnerButton ;
    if ( status === '5'){
        winnerButton =  
          <div>
            <Button onClick={this.changeWinnerShow} >Show Winner</Button>
        </div> ;
    } 
   

    return (
      <div className="App">

         <img src={logo} alt="Ethereum Logo" />

        <h1>Welcome to Smart Voting System</h1>
          Contract Address : {this.state.contract.options.address} <p>  Status : {contract_states[status]}</p>
          <br></br>
          Your Account Address : {this.state.address} {this.state.owner && <p>(Owner) =&gt; <strong>Administrator</strong> </p>}    
          {intro}{voted}
          <div>
              {changeStateButton} 
              { admin &&       
              <Form style={{width : '20%'}} onSubmit={this.handleSubmit}>
                {/* <Form style={{width : '20%'}} onSubmit={this.revertToState}> */}
                    {comboStates}
                    <Button as="input" type="submit" value="Revert" />
                </Form>
              }
          </div>
          <div style={{display: 'flex', justifyContent: 'center'}}>           
            <Card style={{ width: '50rem' }}>
              <br></br>
              { status >= 1  && 
               <Form className="card-body" onSubmit={this.voteFormSubmit}> 
               <Card.Header><strong>Proposals List</strong></Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th style={{width: '30rem'}} >Description</th>
                            { status >= '3'  && 
                              <th>Vote</th>
                            }
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.proposals !== null && this.renderTableData()}
                        </tbody>
                      </Table>
                    </ListGroup.Item>
                  </ListGroup>
              </Card.Body>
              { status >= '3' && status < '5' && ! hasVoted &&       
                <div className="d-grid mt-3">
                  <br></br>
                  <button type="submit" className="btn btn-block btn-primary">Vote</button>
                </div>
              }
              </Form>
            }
{/* Affiche Le champs de saisie d'une proposition  */}
          { status === '1'  && 
            <div className="container">
              <br></br>
                  <div className="card mt-5">
                    <Form className="card-body" onSubmit={this.onFormSubmit}>                      
                        <div className="form-group mb-3">
                          <label className="mb-2"><strong>Proposal</strong></label>                        
                            <input  id="proposal"
                              required
                              type="text" 
                              name="proposal"
                              onChange={this.formObject}
                              value={this.state.newProposal}
                              className={error.name && error.name.length > 0 ? "is-invalid form-control" : "form-control"}/>                           
                                {error.name && error.name.length > 0 && (
                                <span className="invalid-feedback">{error.name}</span>
                                )}                       
                        </div>
                        <div className="row justify-content-center" >
                          <button style={{width: '10rem'}} type="submit" className="btn btn-block btn-primary">Add</button>
                        </div>
                    </Form>
                  </div>
            </div>
          }
          </Card>
        </div>
        { status === '5'  
            && <div><WinnerWindow winner={this.state} /></div>
        }
        {winnerButton}
      </div>
    );
  }
}

export default App;
