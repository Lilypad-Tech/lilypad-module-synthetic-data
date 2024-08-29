// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/manager/AccessManaged.sol";

contract MyToken is ERC721, AccessManaged {
    constructor(address initialAuthority)
        ERC721("MyToken", "MTK")
        AccessManaged(initialAuthority)
    {}
}
