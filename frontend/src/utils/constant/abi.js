const abi = [
    {
        inputs: [{ internalType: "address", name: "to", type: "address" }],
        name: "getClaimableTokens",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "claim",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "to", type: "address" }],
        name: "getProcessableTokens",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        "inputs":[],
        "name":"processTokenRequests",
        "outputs":[],
        "stateMutability":"nonpayable",
        "type":"function"
     },
  
];


export default abi;
