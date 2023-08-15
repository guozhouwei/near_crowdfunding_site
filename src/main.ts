
import * as nearAPI from "near-api-js";
import { FinalExecutionOutcome, FinalExecutionStatus } from 'near-api-js/lib/providers';
import { Account, AccountCreator, Connection } from '@near-js/accounts';

async function main() {
    /*
    * 前提 合约已经部署部署到测试链上：https://explorer.testnet.near.org/transactions/FFAB7bzLQsyyGbUn5XMZTLWN4rvbJA1npXHjuuzPmj6H
    * 合约账户：contract1234501.testnet
    * 合约owner账户（合约中有权创建募捐活动的账户）：owner123.testnet
    */
    const { keyStores, KeyPair, connect, utils} = nearAPI;

    /** 合约owner账户 */
    const account = await contract_owner_account();
    
    /* 调用合约创建募捐活动 */
    const number_campagins = await callmethod_newCampaign(account, "流浪动物救助募捐活动", 500);
    console.log("▶▶▶▶募捐活动编号:%d", number_campagins);

    /** 查看募捐活动信息 */
    const campaginStr = await callmethod_getCrowdFunding(account, number_campagins);
    console.log("▶▶▶▶创建募捐活动:%o", campaginStr);

    /** 募捐参与人 */
    //募捐人信息 zhouzhou_near.testnet
    const account_supply = await supply_funder_account();

    /** 募捐 */
    const number_funders = await callmethod_bid(account_supply, number_campagins);
    console.log("▶▶▶▶%o", number_funders);

    /** 查看募捐活动信息 */
    const campaginBid = await callmethod_getCrowdFunding(account, number_campagins);
    console.log("▶▶▶▶捐赠后募捐活动:%o", campaginBid);                                

    /** 查看参与募捐活动人员信息列表 */
    const funders = await callmethod_getFunders(account, number_campagins);
    console.log("▶▶▶▶募捐活动编码:%o, 捐赠人:%o", number_campagins, funders); 
}

main().catch(console.log)

/**
 * owner账户
 */
async function contract_owner_account() {
  const { keyStores, KeyPair, connect, utils} = nearAPI;
  //
  const myKeyStore = new keyStores.InMemoryKeyStore();
    const PRIVATE_KEY = "ed25519:vFSFoBVC5V7N7Tz5ZGQCNj9NQV15Aue43T8q7JHuQqnw7WECdfA4jDw2WWec56Gy6UmcGBgtc2xmdqpQMZuoCo7";
    // creates a public / private key pair using the provided private key
    const keyPair = KeyPair.fromString(PRIVATE_KEY);
    // adds the keyPair you created to keyStore
    await myKeyStore.setKey("testnet", "owner123.testnet", keyPair);
    //Connecting to NEAR
    const connectionConfig = {
                              networkId: "testnet",
                              keyStore: myKeyStore, // first create a key store 
                              //nodeUrl: "https://rpc.testnet.near.org",
                              nodeUrl: "https://near-testnet.infura.io/v3/5d10c0043a0b473582073373a1f528f1",
                              walletUrl: "https://wallet.testnet.near.org",
                              helperUrl: "https://helper.testnet.near.org",
                              explorerUrl: "https://explorer.testnet.near.org",
                            };
    const nearConnection = await connect(connectionConfig);
    //
    const account = await nearConnection.account("owner123.testnet");
    return account;
}

/**
 * 募捐人
 */
async function supply_funder_account() {
  const { keyStores, KeyPair, connect, utils} = nearAPI;
  //
  const myKeyStore_supply = new keyStores.InMemoryKeyStore();
    const PRIVATE_KEY_SUPPLY = "ed25519:53CyC55TzT7gVJTcx5bjGwZRwpdtBUvmuHexo1noHhQWvnQcUGh7VAyadwZHruMVNar1WvvRsATv2BmXTDvsd7qT";
    const keyPair_supply = KeyPair.fromString(PRIVATE_KEY_SUPPLY);
    await myKeyStore_supply.setKey("testnet", "zhouzhou_near.testnet", keyPair_supply);
    //
    const connectionConfig_supply = {
                                      networkId: "testnet",
                                      keyStore: myKeyStore_supply,
                                      nodeUrl: "https://near-testnet.infura.io/v3/5d10c0043a0b473582073373a1f528f1",
                                      walletUrl: "https://wallet.testnet.near.org",
                                      helperUrl: "https://helper.testnet.near.org",
                                      explorerUrl: "https://explorer.testnet.near.org",
                                    };
    const nearConnection_supply = await connect(connectionConfig_supply);
    const account = await nearConnection_supply.account("zhouzhou_near.testnet");
    return account;
}

/**
 * 查看参与募捐活动人员信息列表
 */
async function callmethod_getFunders(account:Account, number_campagins: number) {
  //
  const { keyStores, KeyPair, connect, utils} = nearAPI;
  //
  const outcome = await account.functionCall({
    contractId: "contract1234501.testnet",
    methodName: "get_funders_by_num_campagins",
    args: {
      num_campagins: number_campagins,
    },
    gas: "300000000000000",
    attachedDeposit: utils.format.parseNearAmount("0"),
  });

  const successValue = (outcome.status as FinalExecutionStatus).SuccessValue;
  if (successValue) {
    const valueRaw = Buffer.from(successValue, 'base64');
    const returnedValue = JSON.parse(valueRaw.toString());
    return returnedValue;
  }
  return "获取募捐人失败";
}

/**
 * 参与募捐
 */
async function callmethod_bid(account:Account, number_campagins: number) {
  //
  const { keyStores, KeyPair, connect, utils} = nearAPI;
  //
  const outcome = await account.functionCall({
    contractId: "contract1234501.testnet",
    methodName: "bid",
    args: {
      num_campagins: number_campagins,
    },
    gas: "300000000000000",
    attachedDeposit: utils.format.parseNearAmount("5"),
  });

  const successValue = (outcome.status as FinalExecutionStatus).SuccessValue;
  if (successValue) {
    const valueRaw = Buffer.from(successValue, 'base64');
    const returnedValue = JSON.parse(valueRaw.toString());
    const num_funder = "第" + returnedValue + "位募捐人";
    return num_funder;
  }
  return "募捐失败";
}

/**
 * 创建募捐活动
 */
async function callmethod_newCampaign(account:Account, theme_campaign:String, funding_goal_capaign:number) {
  //
  const { keyStores, KeyPair, connect, utils} = nearAPI;
  //
  const outcome = await account.functionCall({
    contractId: "contract1234501.testnet",
    methodName: "newCampaign",
    args: {
      theme:theme_campaign,
      receiver: account.accountId,
      number_funders:0,
      funding_goal: funding_goal_capaign,
    },
    gas: "300000000000000",
    attachedDeposit: utils.format.parseNearAmount("0"),
  });

  const successValue = (outcome.status as FinalExecutionStatus).SuccessValue;
  if (successValue) {
    const valueRaw = Buffer.from(successValue, 'base64');
    const returnedValue = JSON.parse(valueRaw.toString())
    if (typeof returnedValue == "number") {
      return returnedValue;
    }
  }
  return 0;
}

/**
 * 查看活动详情
 */
async function callmethod_getCrowdFunding(account:Account, number_campagins: number) {
  //
  const { keyStores, KeyPair, connect, utils} = nearAPI;
  //
  const outcome = await account.functionCall({
    contractId: "contract1234501.testnet",
    methodName: "get_crowdFunding_by_num_campagins",
    args: {
      num_campagins: number_campagins,
    },
    gas: "300000000000000",
    attachedDeposit: utils.format.parseNearAmount("0"),
  });

  const successValue = (outcome.status as FinalExecutionStatus).SuccessValue;
  if (successValue) {
    const valueRaw = Buffer.from(successValue, 'base64');
    const returnedValue = JSON.parse(valueRaw.toString())
    const campaginStr = "募捐活动编号:" + number_campagins + ",募捐活动名称:" + returnedValue.theme + ", 募捐收款账号:" + returnedValue.receiver + ", 目标募捐金额:" + returnedValue.funding_goal + ", 参与募捐人数:" + returnedValue.number_funders + ", 实际募捐金额:" + returnedValue.total_amount
    return campaginStr;
  }
  return "募捐活动不存在";
}

