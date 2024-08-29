// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/manager/AccessManaged.sol";

contract MyToken is ERC1155, AccessManaged {
    constructor(address initialAuthority)
        ERC1155("")
        AccessManaged(initialAuthority)
    {}

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        restricted
    {
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        restricted
    {
        _mintBatch(to, ids, amounts, data);
    }
}
