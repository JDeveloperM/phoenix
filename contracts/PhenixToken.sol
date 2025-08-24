// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PhenixToken
 * @dev ERC20 token with governance, staking rewards, and privacy network incentives
 * Designed for the Phenix privacy messaging ecosystem
 */
contract PhenixToken is ERC20, ERC20Burnable, ERC20Votes, Pausable, Ownable, ReentrancyGuard {
    
    // Token Economics
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant COMMUNITY_ALLOCATION = 400_000_000 * 10**18; // 40%
    uint256 public constant ECOSYSTEM_REWARDS = 300_000_000 * 10**18; // 30%
    uint256 public constant TEAM_ALLOCATION = 150_000_000 * 10**18; // 15%
    uint256 public constant TREASURY = 100_000_000 * 10**18; // 10%
    uint256 public constant LIQUIDITY = 50_000_000 * 10**18; // 5%
    
    // Staking and Rewards
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
    }
    
    mapping(address => StakeInfo) public stakes;
    mapping(address => uint256) public userRewards;
    
    uint256 public totalStaked;
    uint256 public rewardRate = 100; // 1% per year (100 basis points)
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    // Privacy Network Incentives
    mapping(address => bool) public relayOperators;
    mapping(address => uint256) public relayRewards;
    uint256 public relayRewardPool;
    
    // Governance
    uint256 public proposalThreshold = 1_000_000 * 10**18; // 1M tokens to create proposal
    uint256 public votingDelay = 1 days;
    uint256 public votingPeriod = 7 days;
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RelayOperatorRegistered(address indexed operator);
    event RelayRewardDistributed(address indexed operator, uint256 amount);
    
    constructor() 
        ERC20("Phenix", "PHX") 
        ERC20Permit("Phenix")
    {
        // Mint initial supply to contract for controlled distribution
        _mint(address(this), TOTAL_SUPPLY);
        
        // Initialize relay reward pool (30% of total supply)
        relayRewardPool = ECOSYSTEM_REWARDS;
    }
    
    /**
     * @dev Distribute initial token allocations
     * @param communityWallet Address for community allocation
     * @param teamWallet Address for team allocation  
     * @param treasuryWallet Address for treasury allocation
     * @param liquidityWallet Address for liquidity allocation
     */
    function distributeInitialAllocations(
        address communityWallet,
        address teamWallet,
        address treasuryWallet,
        address liquidityWallet
    ) external onlyOwner {
        require(communityWallet != address(0), "Invalid community wallet");
        require(teamWallet != address(0), "Invalid team wallet");
        require(treasuryWallet != address(0), "Invalid treasury wallet");
        require(liquidityWallet != address(0), "Invalid liquidity wallet");
        
        _transfer(address(this), communityWallet, COMMUNITY_ALLOCATION);
        _transfer(address(this), teamWallet, TEAM_ALLOCATION);
        _transfer(address(this), treasuryWallet, TREASURY);
        _transfer(address(this), liquidityWallet, LIQUIDITY);
    }
    
    /**
     * @dev Stake tokens to earn rewards and governance power
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot stake 0 tokens");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Update rewards before changing stake
        _updateRewards(msg.sender);
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Update stake info
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].timestamp = block.timestamp;
        totalStaked += amount;
        
        // Delegate voting power to self
        _delegate(msg.sender, msg.sender);
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @dev Unstake tokens and claim rewards
     * @param amount Amount of tokens to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot unstake 0 tokens");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");
        
        // Update rewards before changing stake
        _updateRewards(msg.sender);
        
        // Update stake info
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        
        // Transfer tokens back to user
        _transfer(address(this), msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @dev Claim accumulated staking rewards
     */
    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);
        
        uint256 reward = userRewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        
        userRewards[msg.sender] = 0;
        
        // Mint new tokens as rewards
        _mint(msg.sender, reward);
        
        emit RewardsClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Register as a relay operator for the privacy network
     */
    function registerRelayOperator() external {
        require(!relayOperators[msg.sender], "Already registered");
        require(stakes[msg.sender].amount >= 10_000 * 10**18, "Minimum 10k PHX stake required");
        
        relayOperators[msg.sender] = true;
        emit RelayOperatorRegistered(msg.sender);
    }
    
    /**
     * @dev Distribute rewards to relay operators (only owner)
     * @param operators Array of relay operator addresses
     * @param amounts Array of reward amounts
     */
    function distributeRelayRewards(
        address[] calldata operators,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(operators.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(relayRewardPool >= totalAmount, "Insufficient reward pool");
        relayRewardPool -= totalAmount;
        
        for (uint256 i = 0; i < operators.length; i++) {
            require(relayOperators[operators[i]], "Not a registered relay operator");
            
            relayRewards[operators[i]] += amounts[i];
            _transfer(address(this), operators[i], amounts[i]);
            
            emit RelayRewardDistributed(operators[i], amounts[i]);
        }
    }
    
    /**
     * @dev Update user rewards based on staking duration
     * @param user Address of the user
     */
    function _updateRewards(address user) internal {
        StakeInfo storage userStake = stakes[user];
        
        if (userStake.amount > 0) {
            uint256 stakingDuration = block.timestamp - userStake.timestamp;
            uint256 reward = (userStake.amount * rewardRate * stakingDuration) / 
                           (10000 * SECONDS_PER_YEAR);
            
            userRewards[user] += reward;
            userStake.timestamp = block.timestamp;
        }
    }
    
    /**
     * @dev Get pending rewards for a user
     * @param user Address of the user
     * @return Pending reward amount
     */
    function pendingRewards(address user) external view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        
        if (userStake.amount == 0) {
            return userRewards[user];
        }
        
        uint256 stakingDuration = block.timestamp - userStake.timestamp;
        uint256 newReward = (userStake.amount * rewardRate * stakingDuration) / 
                           (10000 * SECONDS_PER_YEAR);
        
        return userRewards[user] + newReward;
    }
    
    /**
     * @dev Update reward rate (only owner)
     * @param newRate New reward rate in basis points
     */
    function updateRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 2000, "Reward rate too high"); // Max 20%
        rewardRate = newRate;
    }
    
    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get voting power of an address
     * @param account Address to check
     * @return Voting power amount
     */
    function getVotingPower(address account) external view returns (uint256) {
        return getVotes(account);
    }
    
    // Override required functions
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }
    
    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }
    
    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}
