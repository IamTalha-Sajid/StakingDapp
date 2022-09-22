// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function mint(address _userAdd, uint256 _amount) external returns(bool);
}

contract staking is Ownable {

    //State Variables
    IERC20 rewardToken;
    uint256 minimumStakingTime;
    uint256 rewardPerMinutes;

    //Structs
    struct stake{
        address payable userId;
        uint256 stakingTime;
        uint256 amount;
        bool staked;
    }

    //Mappings
    mapping (address => stake) private stakes;

    //OnlyOwner Functions
    //Function to set the Address of the Token you wish to give as a Reward
    function addRewardToken (address _token) public onlyOwner {
        rewardToken = IERC20(_token);
    }

    //Function to set the minimum amount user can Stake
    function setMinimumStakingTime (uint256 _time) public onlyOwner {
        minimumStakingTime = _time;
    }

    //Function to set the Reward given to the user for staking ETH per Minute
    function setRewardPerMinutes (uint256 _amount) public onlyOwner {
        rewardPerMinutes = _amount;
    }

    //Function to check the Total Staked ETH
    function checkContractBalance () public view onlyOwner returns(uint256) {
        return (address(this).balance);
    }

    //Function to Add Stakes to the Smart Contract
    function addStake (uint256 _amount) public payable {
        require(msg.value >= _amount, "Insufficient Funds");
        require(stakes[msg.sender].staked == false, "You have already Staked");
        stakes[msg.sender] = stake (payable(msg.sender), block.timestamp, _amount, true);
    }

    //Reward Function that will award the user
    function reward(address _userId, uint256 _time) private {
        rewardToken.mint(_userId, _time);
    }

    //Function to unStake the ETH from the Smart Contract
    function unStake() public {
        require(((block.timestamp - stakes[msg.sender].stakingTime)/60) >  minimumStakingTime);
        require(stakes[msg.sender].staked == true, "You have not Staked yet");
        uint256 time = ((block.timestamp - stakes[msg.sender].stakingTime) / 60);
        reward(msg.sender, time);
        payable(msg.sender).transfer(stakes[msg.sender].amount);
        delete stakes[msg.sender];
    }

    //Function to check if the user has already staked ETH or not
    function checkStaked(address _user) public view returns(bool){
        return (stakes[_user].staked);
    }

}