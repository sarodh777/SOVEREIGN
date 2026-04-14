// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SovereignGovernance {
    address public admin;

    struct Proposal {
        string id;
        string description;
        uint256 supportVotes;
        uint256 againstVotes;
        bool isActive;
    }

    mapping(string => Proposal) public proposals;
    mapping(string => mapping(address => bool)) public hasVoted;

    event ProposalCreated(string id, string description);
    event VoteCast(string proposalId, address voter, bool support);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    constructor() {
        admin = msg.sender;
        // Create initial dummy proposals matching our UI
        _createProposal("SLP-0824", "Liquidity Pool Expansion: Tier-1 Institutional Nodes");
        _createProposal("SLP-0825", "Governance Weight Recalibration (v4.3)");
    }

    function _createProposal(string memory _id, string memory _description) internal {
        proposals[_id] = Proposal({
            id: _id,
            description: _description,
            supportVotes: 0,
            againstVotes: 0,
            isActive: true
        });
        emit ProposalCreated(_id, _description);
    }

    function createProposal(string memory _id, string memory _description) external onlyAdmin {
        require(!proposals[_id].isActive, "Proposal already exists");
        _createProposal(_id, _description);
    }

    function vote(string memory _id, bool _support) external {
        require(proposals[_id].isActive, "Proposal is not active");
        require(!hasVoted[_id][msg.sender], "You have already voted on this proposal");

        if (_support) {
            proposals[_id].supportVotes += 1;
        } else {
            proposals[_id].againstVotes += 1;
        }

        hasVoted[_id][msg.sender] = true;
        
        emit VoteCast(_id, msg.sender, _support);
    }

    function getProposal(string memory _id) external view returns (string memory, string memory, uint256, uint256, bool) {
        Proposal memory p = proposals[_id];
        return (p.id, p.description, p.supportVotes, p.againstVotes, p.isActive);
    }
}
