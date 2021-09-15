// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";


contract Voting is Ownable {
    
    address admin;
    
    uint private winningProposalId ;
    uint private maxCount = 0;
    
    // Map des votants
    mapping(address=>Voter) voters ;
    // Map des propositions par votants 
    mapping(address=>Proposal[]) internal  proposals  ;
    
    // Map des propositions
    // mapping(uint=>Proposal) proposalMap;
    mapping(string=>Proposal) proposalByString;
    
    // Table de toutes les propositions
    Proposal[] public proposalVote ;
    uint internal lastProposalId ;
    
    //
    // voterNumber -> addresses[voterNumber] = voters[address]
    //
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint voterNumber;
        int proposalId;
    }

    
    uint public lastVoterIndex  ;

    struct Proposal {
        uint index;
        string description;
        uint  voteCount ;
    }

    WorkflowStatus public status ;
    
    event VoterRegistered(address voterAddress);
    event VoterRevoked(address voterAddress);

    event ProposalsRegistrationStarted();
    event ProposalsRegistrationEnded();
    event ProposalRegistered(uint proposalId);
    event VotingSessionStarted();
    event VotingSessionEnded();
    event Voted (address voter, uint proposalId);
    event VotesTallied();
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    
    //
    // Evenement liés à l'enregistrement des votants
    //
    event WhitelistRevoked(address _address);
    event WhitelistPacked(string _message);
   
    enum WorkflowStatus {
            RegisteringVoters,
            ProposalsRegistrationStarted,
            ProposalsRegistrationEnded,
            VotingSessionStarted,
            VotingSessionEnded,
            VotesTallied
    }
    
    /**
     * 
     * Only for Admin/Owner
     * 
     */
    function revertState(WorkflowStatus _status) public onlyOwner returns(WorkflowStatus,WorkflowStatus) {
        WorkflowStatus from = status;
        status = _status;
        emit WorkflowStatusChange(from,status);
        return (from, status);
    }
    
    function changeState() public onlyOwner returns(WorkflowStatus) {
        require(
            status != WorkflowStatus.VotesTallied,
            "No State to change, Voting process is over..."
        );
        if ( status == WorkflowStatus.RegisteringVoters){
             status = WorkflowStatus.ProposalsRegistrationStarted;
             emit ProposalsRegistrationStarted();
        }else if ( status == WorkflowStatus.ProposalsRegistrationStarted){
             status = WorkflowStatus.ProposalsRegistrationEnded;
             emit ProposalsRegistrationEnded();
        }else if ( status == WorkflowStatus.ProposalsRegistrationEnded ){
             status = WorkflowStatus.VotingSessionStarted;
             emit VotingSessionStarted();
        }else if ( status == WorkflowStatus.VotingSessionStarted ){
             status = WorkflowStatus.VotingSessionEnded;
             emit VotingSessionEnded();
        }else if ( status == WorkflowStatus.VotingSessionEnded ){
             computeWinningProposal();
             status = WorkflowStatus.VotesTallied;
             emit VotesTallied();
        }
        return status;
    }
    
    function revoke(address _address) public onlyOwner {
        voters[_address].isRegistered = false;
        voters[_address].hasVoted = false;
        voters[_address].proposalId = -1;
        emit VoterRevoked(_address);
    }
    
    constructor(){
        admin=msg.sender;
        lastProposalId = 0;
        lastVoterIndex = 0;
        status = WorkflowStatus.RegisteringVoters;
    }
    
    
    function register(address _address) public {
        require(
            status == WorkflowStatus.RegisteringVoters,
            "The Voter Registration is closed"
        );
        require(
            voters[_address].isRegistered != true ,
            "The Voter is already registred"
        );
        Voter memory  v ;
        v.isRegistered = true;
        v.voterNumber = lastVoterIndex++;
        v.proposalId = -1;
        voters[_address] = v;
        emit VoterRegistered(_address);
    }
    
    
    function isRegistred(address _address) public view returns(bool){
        return ( voters[_address].isRegistered ) ;
    }
    
    function hasVoted(address _address) public view returns(bool, int){
        return ( voters[_address].hasVoted, (voters[_address].hasVoted ? voters[_address].proposalId : -1 )) ;
    }
    
    
    /**
     * 
     * Voters can vote if :
     *   - Voting session is open
     *   - They are registred
     *   - The proposal ID exists
     *   - They haven't already voted
     **/
    function vote(uint _proposalId) public returns(bool) {
        require(
            status == WorkflowStatus.VotingSessionStarted,
            "Voting session is NOT open or closed"
        );
        require(
            voters[msg.sender].isRegistered,
            "The Voter is NOT registred"
        );
        require(
            ! voters[msg.sender].hasVoted,
            "The Voter has already voted"
        );
         require(
             _proposalId < proposalVote.length && proposalVote.length > 0,
            "The proposal ID is Unknown"
        );
        
        // proposalMap[_proposalId].voteCount++;
        proposalVote[_proposalId].voteCount++;
        
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].proposalId = int(_proposalId);
        emit Voted(msg.sender, _proposalId);
        
        return voters[msg.sender].hasVoted;
    }
    
    function addProposal(string memory _description) public returns(uint) {
        require(
            status == WorkflowStatus.ProposalsRegistrationStarted,
            "Proposal Registration is NOT Started"
        );
        require(
            voters[msg.sender].isRegistered,
            "The Voter is NOT registred"
        );
        
       
       Proposal memory pr = proposalByString[_description];
       
       if ( keccak256(abi.encodePacked(pr.description)) == keccak256(abi.encodePacked(_description)) ){
           revert("Proposal already exists !!!") ;
       }
       
        Proposal[] storage entries = proposals[msg.sender] ;
        
        pr.index = lastProposalId++;
        pr.description = _description;
        pr.voteCount=0;
        
        entries.push(pr);
        proposalVote.push(pr) ;
        proposalByString[_description]  = pr;
        
        emit ProposalRegistered(lastProposalId);
        return lastProposalId;
    }
    
    
    function computeWinningProposal() private {
        require(
            status == WorkflowStatus.VotingSessionEnded,
            "Voting session is NOT yet closed"
        );
        
        for(uint idx=0;idx < proposalVote.length;idx++ ){
            if ( proposalVote[idx].voteCount > maxCount ){
                 maxCount = proposalVote[idx].voteCount;
                 winningProposalId = proposalVote[idx].index;
            }
        }
    }
    
    function getWinningProposal() public view returns (Proposal memory){
        require(
            status == WorkflowStatus.VotesTallied,
            "Votes are NOT already tallied"
        );
        return proposalVote[winningProposalId];
    }
    
    
    function numberProposalFor(address _voter) public view returns (uint){
        Proposal[] storage entries = proposals[_voter] ;
        return entries.length;
    }
    
    function getAllProposals() public view returns(Proposal[] memory){
       return proposalVote;
    }
    
     function getLastProposalId() public view returns(uint){
       return lastProposalId;
    }
       
}