const fs = require('fs');
const seedrandom = require('seedrandom');
const archiver = require('archiver');
const solc = require('solc');

function getRandomInt(rng, max) {
    return Math.floor(rng() * max);
}

function getRandomElement(rng, array) {
    return array[getRandomInt(rng, array.length)];
}

// ERC-20 Contract Generator
function generateERC20Contract(rng) {
    const tokenName = `Token${getRandomInt(rng, 10000)}`;
    const symbol = `TKN${getRandomInt(rng, 100)}`;
    const totalSupply = getRandomInt(rng, 1e6) + 1e6;
    const decimals = getRandomInt(rng, 18) + 1;

    return `
    pragma solidity ^0.8.0;

    contract ${tokenName} {
        string public name = "${tokenName}";
        string public symbol = "${symbol}";
        uint8 public decimals = ${decimals};
        uint256 public totalSupply = ${totalSupply} * (10 ** uint256(decimals));
        mapping(address => uint256) public balanceOf;
        mapping(address => mapping(address => uint256)) public allowance;

        constructor() {
            balanceOf[msg.sender] = totalSupply;
        }

        event Transfer(address indexed from, address indexed to, uint256 value);
        event Approval(address indexed owner, address indexed spender, uint256 value);

        function transfer(address _to, uint256 _value) public returns (bool success) {
            require(balanceOf[msg.sender] >= _value);
            balanceOf[msg.sender] -= _value;
            balanceOf[_to] += _value;
            emit Transfer(msg.sender, _to, _value);
            return true;
        }

        function approve(address _spender, uint256 _value) public returns (bool success) {
            allowance[msg.sender][_spender] = _value;
            emit Approval(msg.sender, _spender, _value);
            return true;
        }

        function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
            require(_value <= balanceOf[_from]);
            require(_value <= allowance[_from][msg.sender]);
            balanceOf[_from] -= _value;
            balanceOf[_to] += _value;
            allowance[_from][msg.sender] -= _value;
            emit Transfer(_from, _to, _value);
            return true;
        }
    }
    `;
}

// ERC-721 Contract Generator (with all required functions)
function getInlinedERC721Contract() {
    return `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;

    interface IERC721 {
        event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
        event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
        event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

        function balanceOf(address owner) external view returns (uint256 balance);
        function ownerOf(uint256 tokenId) external view returns (address owner);
        function safeTransferFrom(address from, address to, uint256 tokenId) external;
        function transferFrom(address from, address to, uint256 tokenId) external;
        function approve(address to, uint256 tokenId) external;
        function getApproved(uint256 tokenId) external view returns (address operator);
        function setApprovalForAll(address operator, bool approved) external;
        function isApprovedForAll(address owner, address operator) external view returns (bool);
        function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    }

    interface IERC165 {
        function supportsInterface(bytes4 interfaceId) external view returns (bool);
    }

    abstract contract ERC165 is IERC165 {
        function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
            return interfaceId == type(IERC165).interfaceId;
        }
    }

    abstract contract ERC721 is ERC165, IERC721 {
        using Address for address;
        using Strings for uint256;

        string private _name;
        string private _symbol;

        mapping(uint256 => address) private _owners;
        mapping(address => uint256) private _balances;
        mapping(uint256 => address) private _tokenApprovals;
        mapping(address => mapping(address => bool)) private _operatorApprovals;

        constructor(string memory name_, string memory symbol_) {
            _name = name_;
            _symbol = symbol_;
        }

        function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
            return
                interfaceId == type(IERC721).interfaceId ||
                super.supportsInterface(interfaceId);
        }

        function balanceOf(address owner) public view virtual override returns (uint256) {
            require(owner != address(0), "ERC721: balance query for the zero address");
            return _balances[owner];
        }

        function ownerOf(uint256 tokenId) public view virtual override returns (address) {
            address owner = _owners[tokenId];
            require(owner != address(0), "ERC721: owner query for nonexistent token");
            return owner;
        }

        function approve(address to, uint256 tokenId) public virtual override {
            address owner = ERC721.ownerOf(tokenId);
            require(to != owner, "ERC721: approval to current owner");

            require(
                msg.sender == owner || isApprovedForAll(owner, msg.sender),
                "ERC721: approve caller is not owner nor approved for all"
            );

            _approve(to, tokenId);
        }

        function getApproved(uint256 tokenId) public view virtual override returns (address) {
            require(_exists(tokenId), "ERC721: approved query for nonexistent token");

            return _tokenApprovals[tokenId];
        }

        function setApprovalForAll(address operator, bool approved) public virtual override {
            require(operator != msg.sender, "ERC721: approve to caller");

            _operatorApprovals[msg.sender][operator] = approved;
            emit ApprovalForAll(msg.sender, operator, approved);
        }

        function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
            return _operatorApprovals[owner][operator];
        }

        function transferFrom(
            address from,
            address to,
            uint256 tokenId
        ) public virtual override {
            require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");

            _transfer(from, to, tokenId);
        }

        function safeTransferFrom(
            address from,
            address to,
            uint256 tokenId
        ) public virtual override {
            safeTransferFrom(from, to, tokenId, "");
        }

        function safeTransferFrom(
            address from,
            address to,
            uint256 tokenId,
            bytes memory _data
        ) public virtual override {
            require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");
            _safeTransfer(from, to, tokenId, _data);
        }

        function _safeTransfer(
            address from,
            address to,
            uint256 tokenId,
            bytes memory _data
        ) internal virtual {
            _transfer(from, to, tokenId);
            require(_checkOnERC721Received(from, to, tokenId, _data), "ERC721: transfer to non ERC721Receiver implementer");
        }

        function _exists(uint256 tokenId) internal view virtual returns (bool) {
            return _owners[tokenId] != address(0);
        }

        function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
            require(_exists(tokenId), "ERC721: operator query for nonexistent token");
            address owner = ERC721.ownerOf(tokenId);
            return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
        }

        function _safeMint(address to, uint256 tokenId) internal virtual {
            _safeMint(to, tokenId, "");
        }

        function _safeMint(
            address to,
            uint256 tokenId,
            bytes memory _data
        ) internal virtual {
            _mint(to, tokenId);
            require(
                _checkOnERC721Received(address(0), to, tokenId, _data),
                "ERC721: transfer to non ERC721Receiver implementer"
            );
        }

        function _mint(address to, uint256 tokenId) internal virtual {
            require(to != address(0), "ERC721: mint to the zero address");
            require(!_exists(tokenId), "ERC721: token already minted");

            _beforeTokenTransfer(address(0), to, tokenId);

            _balances[to] += 1;
            _owners[tokenId] = to;

            emit Transfer(address(0), to, tokenId);
        }

        function _burn(uint256 tokenId) internal virtual {
            address owner = ERC721.ownerOf(tokenId);

            _beforeTokenTransfer(owner, address(0), tokenId);

            _approve(address(0), tokenId);

            _balances[owner] -= 1;
            delete _owners[tokenId];

            emit Transfer(owner, address(0), tokenId);
        }

        function _transfer(
            address from,
            address to,
            uint256 tokenId
        ) internal virtual {
            require(ERC721.ownerOf(tokenId) == from, "ERC721: transfer of token that is not own");
            require(to != address(0), "ERC721: transfer to the zero address");

            _beforeTokenTransfer(from, to, tokenId);

            _approve(address(0), tokenId);

            _balances[from] -= 1;
            _balances[to] += 1;
            _owners[tokenId] = to;

            emit Transfer(from, to, tokenId);
        }

        function _approve(address to, uint256 tokenId) internal virtual {
            _tokenApprovals[tokenId] = to;
            emit Approval(ERC721.ownerOf(tokenId), to, tokenId);
        }

        function _checkOnERC721Received(
            address from,
            address to,
            uint256 tokenId,
            bytes memory _data
        ) private returns (bool) {
            if (to.isContract()) {
                try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, _data) returns (bytes4 retval) {
                    return retval == IERC721Receiver.onERC721Received.selector;
                } catch (bytes memory reason) {
                    if (reason.length == 0) {
                        revert("ERC721: transfer to non ERC721Receiver implementer");
                    } else {
                        assembly {
                            revert(add(32, reason), mload(reason))
                        }
                    }
                }
            } else {
                return true;
            }
        }

        function _beforeTokenTransfer(
            address from,
            address to,
            uint256 tokenId
        ) internal virtual {}
    }

    library Address {
        function isContract(address account) internal view returns (bool) {
            uint256 size;
            assembly { size := extcodesize(account) }
            return size > 0;
        }
    }

    library Strings {
        bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";

        function toString(uint256 value) internal pure returns (string memory) {
            if (value == 0) {
                return "0";
            }
            uint256 temp = value;
            uint256 digits;
            while (temp != 0) {
                digits++;
                temp /= 10;
            }
            bytes memory buffer = new bytes(digits);
            while (value != 0) {
                digits -= 1;
                buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
                value /= 10;
            }
            return string(buffer);
        }
    }

    interface IERC721Receiver {
        function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
    }
    `;
}

function generateERC721Contract(rng) {
    const tokenName = `NFT${getRandomInt(rng, 10000)}`;
    const symbol = `NFT${getRandomInt(rng, 100)}`;

    return `
    ${getInlinedERC721Contract()}

    contract ${tokenName} is ERC721 {
        constructor() ERC721("${tokenName}", "${symbol}") {}

        function mint(address to, uint256 tokenId) public {
            _mint(to, tokenId);
        }

        function burn(uint256 tokenId) public {
            _burn(tokenId);
        }

        function transfer(address to, uint256 tokenId) public {
            require(ownerOf(tokenId) == msg.sender, "You are not the owner");
            safeTransferFrom(msg.sender, to, tokenId);
        }
    }
    `;
}

function getInlinedERC1155Contract() {
    return `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;

    interface IERC1155 {
        event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
        event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);
        event ApprovalForAll(address indexed account, address indexed operator, bool approved);
        event URI(string value, uint256 indexed id);

        function balanceOf(address account, uint256 id) external view returns (uint256);
        function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) external view returns (uint256[] memory);
        function setApprovalForAll(address operator, bool approved) external;
        function isApprovedForAll(address account, address operator) external view returns (bool);
        function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
        function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external;
    }

    interface IERC165 {
        function supportsInterface(bytes4 interfaceId) external view returns (bool);
    }

    abstract contract ERC165 is IERC165 {
        function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
            return interfaceId == type(IERC165).interfaceId;
        }
    }

    abstract contract ERC1155 is ERC165, IERC1155 {
        using Address for address;

        mapping(uint256 => mapping(address => uint256)) private _balances;
        mapping(address => mapping(address => bool)) private _operatorApprovals;

        string private _uri;

        constructor(string memory uri_) {
            _setURI(uri_);
        }

        function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
            return interfaceId == type(IERC1155).interfaceId || super.supportsInterface(interfaceId);
        }

        function balanceOf(address account, uint256 id) public view virtual override returns (uint256) {
            require(account != address(0), "ERC1155: balance query for the zero address");
            return _balances[id][account];
        }

        function balanceOfBatch(address[] memory accounts, uint256[] memory ids) public view virtual override returns (uint256[] memory) {
            require(accounts.length == ids.length, "ERC1155: accounts and ids length mismatch");

            uint256[] memory batchBalances = new uint256[](accounts.length);

            for (uint256 i = 0; i < accounts.length; ++i) {
                batchBalances[i] = balanceOf(accounts[i], ids[i]);
            }

            return batchBalances;
        }

        function setApprovalForAll(address operator, bool approved) public virtual override {
            require(operator != msg.sender, "ERC1155: setting approval status for self");

            _operatorApprovals[msg.sender][operator] = approved;
            emit ApprovalForAll(msg.sender, operator, approved);
        }

        function isApprovedForAll(address account, address operator) public view virtual override returns (bool) {
            return _operatorApprovals[account][operator];
        }

        function safeTransferFrom(
            address from,
            address to,
            uint256 id,
            uint256 amount,
            bytes memory data
        ) public virtual override {
            require(to != address(0), "ERC1155: transfer to the zero address");
            require(
                from == msg.sender || isApprovedForAll(from, msg.sender),
                "ERC1155: caller is not owner nor approved"
            );

            _safeTransferFrom(from, to, id, amount, data);
        }

        function safeBatchTransferFrom(
            address from,
            address to,
            uint256[] memory ids,
            uint256[] memory amounts,
            bytes memory data
        ) public virtual override {
            require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");
            require(to != address(0), "ERC1155: transfer to the zero address");
            require(
                from == msg.sender || isApprovedForAll(from, msg.sender),
                "ERC1155: caller is not owner nor approved"
            );

            _safeBatchTransferFrom(from, to, ids, amounts, data);
        }

        function _safeTransferFrom(
            address from,
            address to,
            uint256 id,
            uint256 amount,
            bytes memory data
        ) internal virtual {
            uint256 fromBalance = _balances[id][from];
            require(fromBalance >= amount, "ERC1155: insufficient balance for transfer");
            _balances[id][from] = fromBalance - amount;
            _balances[id][to] += amount;

            emit TransferSingle(msg.sender, from, to, id, amount);

            _doSafeTransferAcceptanceCheck(msg.sender, from, to, id, amount, data);
        }

        function _safeBatchTransferFrom(
            address from,
            address to,
            uint256[] memory ids,
            uint256[] memory amounts,
            bytes memory data
        ) internal virtual {
            require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");

            for (uint256 i = 0; i < ids.length; ++i) {
                uint256 id = ids[i];
                uint256 amount = amounts[i];

                uint256 fromBalance = _balances[id][from];
                require(fromBalance >= amount, "ERC1155: insufficient balance for transfer");
                _balances[id][from] = fromBalance - amount;
                _balances[id][to] += amount;
            }

            emit TransferBatch(msg.sender, from, to, ids, amounts);

            _doSafeBatchTransferAcceptanceCheck(msg.sender, from, to, ids, amounts, data);
        }

        function _setURI(string memory newuri) internal virtual {
            _uri = newuri;
        }

        function _mint(address to, uint256 id, uint256 amount, bytes memory data) internal virtual {
            require(to != address(0), "ERC1155: mint to the zero address");

            _beforeTokenTransfer(address(0), to, id, amount, "");

            _balances[id][to] += amount;
            emit TransferSingle(msg.sender, address(0), to, id, amount);

            _doSafeTransferAcceptanceCheck(msg.sender, address(0), to, id, amount, data);
        }

        function _burn(address from, uint256 id, uint256 amount) internal virtual {
            require(from != address(0), "ERC1155: burn from the zero address");

            _beforeTokenTransfer(from, address(0), id, amount, "");

            uint256 fromBalance = _balances[id][from];
            require(fromBalance >= amount, "ERC1155: burn amount exceeds balance");
            _balances[id][from] = fromBalance - amount;

            emit TransferSingle(msg.sender, from, address(0), id, amount);
        }

        function _doSafeTransferAcceptanceCheck(
            address operator,
            address from,
            address to,
            uint256 id,
            uint256 amount,
            bytes memory data
        ) private {
            if (to.isContract()) {
                try IERC1155Receiver(to).onERC1155Received(operator, from, id, amount, data) returns (bytes4 response) {
                    if (response != IERC1155Receiver.onERC1155Received.selector) {
                        revert("ERC1155: ERC1155Receiver rejected tokens");
                    }
                } catch Error(string memory reason) {
                    revert(reason);
                } catch {
                    revert("ERC1155: transfer to non ERC1155Receiver implementer");
                }
            }
        }

        function _doSafeBatchTransferAcceptanceCheck(
            address operator,
            address from,
            address to,
            uint256[] memory ids,
            uint256[] memory amounts,
            bytes memory data
        ) private {
            if (to.isContract()) {
                try IERC1155Receiver(to).onERC1155BatchReceived(operator, from, ids, amounts, data) returns (bytes4 response) {
                    if (response != IERC1155Receiver.onERC1155BatchReceived.selector) {
                        revert("ERC1155: ERC1155Receiver rejected tokens");
                    }
                } catch Error(string memory reason) {
                    revert(reason);
                } catch {
                    revert("ERC1155: transfer to non ERC1155Receiver implementer");
                }
            }
        }

        function _beforeTokenTransfer(
            address from,
            address to,
            uint256 id,
            uint256 amount,
            bytes memory data
        ) internal virtual {}
    }

    interface IERC1155Receiver {
        function onERC1155Received(
            address operator,
            address from,
            uint256 id,
            uint256 value,
            bytes calldata data
        ) external returns (bytes4);

        function onERC1155BatchReceived(
            address operator,
            address from,
            uint256[] calldata ids,
            uint256[] calldata values,
            bytes calldata data
        ) external returns (bytes4);
    }

    library Address {
        function isContract(address account) internal view returns (bool) {
            uint256 size;
            assembly { size := extcodesize(account) }
            return size > 0;
        }
    }
    `;
}

function generateERC1155Contract(rng) {
    const uri = `https://api.example.com/metadata/${getRandomInt(rng, 10000)}`;

    return `
    ${getInlinedERC1155Contract()}

    contract MyERC1155Token is ERC1155 {
        constructor() ERC1155("${uri}") {}

        function mint(address account, uint256 id, uint256 amount, bytes memory data) public {
            _mint(account, id, amount, data);
        }

        function burn(address account, uint256 id, uint256 amount) public {
            _burn(account, id, amount);
        }
    }
    `;
}

function getInlinedERC777Contract() {
    return `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;

    interface IERC777 {
        function name() external view returns (string memory);
        function symbol() external view returns (string memory);
        function totalSupply() external view returns (uint256);
        function balanceOf(address owner) external view returns (uint256);
        function send(address recipient, uint256 amount, bytes calldata data) external;
        function burn(uint256 amount, bytes calldata data) external;
        function isOperatorFor(address operator, address tokenHolder) external view returns (bool);
        function authorizeOperator(address operator) external;
        function revokeOperator(address operator) external;
        function defaultOperators() external view returns (address[] memory);

        event Sent(address indexed operator, address indexed from, address indexed to, uint256 amount, bytes data, bytes operatorData);
        event Minted(address indexed operator, address indexed to, uint256 amount, bytes data, bytes operatorData);
        event Burned(address indexed operator, address indexed from, uint256 amount, bytes data, bytes operatorData);
        event AuthorizedOperator(address indexed operator, address indexed tokenHolder);
        event RevokedOperator(address indexed operator, address indexed tokenHolder);
    }

    interface IERC777Recipient {
        function tokensReceived(
            address operator,
            address from,
            address to,
            uint256 amount,
            bytes calldata userData,
            bytes calldata operatorData
        ) external;
    }

    interface IERC777Sender {
        function tokensToSend(
            address operator,
            address from,
            address to,
            uint256 amount,
            bytes calldata userData,
            bytes calldata operatorData
        ) external;
    }

    interface IERC1820Registry {
        function setInterfaceImplementer(address account, bytes32 interfaceHash, address implementer) external;
        function getInterfaceImplementer(address account, bytes32 interfaceHash) external view returns (address);
        function setManager(address account, address newManager) external;
        function getManager(address account) external view returns (address);

        event InterfaceImplementerSet(address indexed account, bytes32 indexed interfaceHash, address indexed implementer);
        event ManagerChanged(address indexed account, address indexed newManager);
    }

    library Address {
        function isContract(address account) internal view returns (bool) {
            uint256 size;
            assembly { size := extcodesize(account) }
            return size > 0;
        }
    }

    contract Context {
        function _msgSender() internal view virtual returns (address) {
            return msg.sender;
        }

        function _msgData() internal view virtual returns (bytes calldata) {
            return msg.data;
        }
    }

    contract ERC777 is IERC777, Context {
        using Address for address;

        IERC1820Registry internal constant _ERC1820_REGISTRY = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);

        bytes32 private constant _TOKENS_SENDER_INTERFACE_HASH = keccak256("ERC777TokensSender");
        bytes32 private constant _TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

        mapping(address => uint256) private _balances;
        mapping(address => mapping(address => bool)) private _operators;
        uint256 private _totalSupply;

        string private _name;
        string private _symbol;

        address[] private _defaultOperatorsArray;
        mapping(address => bool) private _defaultOperators;
        mapping(address => mapping(address => bool)) private _revokedDefaultOperators;

        constructor(
            string memory name_,
            string memory symbol_,
            address[] memory defaultOperators_
        ) {
            _name = name_;
            _symbol = symbol_;
            _defaultOperatorsArray = defaultOperators_;

            for (uint256 i = 0; i < defaultOperators_.length; i++) {
                _defaultOperators[defaultOperators_[i]] = true;
            }

            _ERC1820_REGISTRY.setInterfaceImplementer(address(this), keccak256("ERC777Token"), address(this));
            _ERC1820_REGISTRY.setInterfaceImplementer(address(this), keccak256("ERC20Token"), address(this));
        }

        function name() public view override returns (string memory) {
            return _name;
        }

        function symbol() public view override returns (string memory) {
            return _symbol;
        }

        function totalSupply() public view override returns (uint256) {
            return _totalSupply;
        }

        function balanceOf(address owner) public view override returns (uint256) {
            return _balances[owner];
        }

        function send(address recipient, uint256 amount, bytes calldata data) public override {
            _send(_msgSender(), _msgSender(), recipient, amount, data, "", true);
        }

        function burn(uint256 amount, bytes calldata data) public override {
            _burn(_msgSender(), _msgSender(), amount, data, "");
        }

        function isOperatorFor(address operator, address tokenHolder) public view override returns (bool) {
            return operator == tokenHolder || _operators[tokenHolder][operator] || (_defaultOperators[operator] && !_revokedDefaultOperators[tokenHolder][operator]);
        }

        function authorizeOperator(address operator) public override {
            require(_msgSender() != operator, "ERC777: authorizing self as operator");

            if (_defaultOperators[operator]) {
                delete _revokedDefaultOperators[_msgSender()][operator];
            } else {
                _operators[_msgSender()][operator] = true;
            }

            emit AuthorizedOperator(operator, _msgSender());
        }

        function revokeOperator(address operator) public override {
            require(operator != _msgSender(), "ERC777: revoking self as operator");

            if (_defaultOperators[operator]) {
                _revokedDefaultOperators[_msgSender()][operator] = true;
            } else {
                delete _operators[_msgSender()][operator];
            }

            emit RevokedOperator(operator, _msgSender());
        }

        function defaultOperators() public view override returns (address[] memory) {
            return _defaultOperatorsArray;
        }

        function operatorSend(
            address sender,
            address recipient,
            uint256 amount,
            bytes calldata data,
            bytes calldata operatorData
        ) public {
            require(isOperatorFor(_msgSender(), sender), "ERC777: caller is not an operator for holder");
            _send(_msgSender(), sender, recipient, amount, data, operatorData, true);
        }

        function operatorBurn(
            address account,
            uint256 amount,
            bytes calldata data,
            bytes calldata operatorData
        ) public {
            require(isOperatorFor(_msgSender(), account), "ERC777: caller is not an operator for holder");
            _burn(_msgSender(), account, amount, data, operatorData);
        }

        function _mint(
            address account,
            uint256 amount,
            bytes memory userData,
            bytes memory operatorData
        ) internal {
            require(account != address(0), "ERC777: mint to the zero address");

            _beforeTokenTransfer(address(0), account, amount);

            _totalSupply += amount;
            _balances[account] += amount;

            _callTokensReceived(_msgSender(), address(0), account, amount, userData, operatorData, true);

            emit Minted(_msgSender(), account, amount, userData, operatorData);
        }

        function _send(
            address operator,
            address from,
            address to,
            uint256 amount,
            bytes memory userData,
            bytes memory operatorData,
            bool requireReceptionAck
        ) private {
            require(from != address(0), "ERC777: send from the zero address");
            require(to != address(0), "ERC777: send to the zero address");

            _beforeTokenTransfer(from, to, amount);

            _callTokensToSend(operator, from, to, amount, userData, operatorData);

            _balances[from] -= amount;
            _balances[to] += amount;

            _callTokensReceived(operator, from, to, amount, userData, operatorData, requireReceptionAck);

            emit Sent(operator, from, to, amount, userData, operatorData);
        }

        function _burn(
            address operator,
            address from,
            uint256 amount,
            bytes memory userData,
            bytes memory operatorData
        ) private {
            require(from != address(0), "ERC777: burn from the zero address");

            _beforeTokenTransfer(from, address(0), amount);

            _callTokensToSend(operator, from, address(0), amount, userData, operatorData);

            _balances[from] -= amount;
            _totalSupply -= amount;

            emit Burned(operator, from, amount, userData, operatorData);
        }

        function _callTokensToSend(
            address operator,
            address from,
            address to,
            uint256 amount,
            bytes memory userData,
            bytes memory operatorData
        ) private {
            address implementer = _ERC1820_REGISTRY.getInterfaceImplementer(from, _TOKENS_SENDER_INTERFACE_HASH);
            if (implementer != address(0)) {
                IERC777Sender(implementer).tokensToSend(operator, from, to, amount, userData, operatorData);
            }
        }

        function _callTokensReceived(
            address operator,
            address from,
            address to,
            uint256 amount,
            bytes memory userData,
            bytes memory operatorData,
            bool requireReceptionAck
        ) private {
            address implementer = _ERC1820_REGISTRY.getInterfaceImplementer(to, _TOKENS_RECIPIENT_INTERFACE_HASH);
            if (implementer != address(0)) {
                IERC777Recipient(implementer).tokensReceived(operator, from, to, amount, userData, operatorData);
            } else if (requireReceptionAck) {
                require(!to.isContract(), "ERC777: token recipient contract has no implementer for ERC777TokensRecipient");
            }
        }

        function _beforeTokenTransfer(
            address from,
            address to,
            uint256 amount
        ) internal virtual {}
    }
    `;
}

function generateERC777Contract(rng) {
    const tokenName = `Token777${getRandomInt(rng, 10000)}`;
    const symbol = `TKN777${getRandomInt(rng, 100)}`;
    const totalSupply = getRandomInt(rng, 1e6) + 1e6;

    return `
    ${getInlinedERC777Contract()}

    contract ${tokenName} is ERC777 {
        constructor(address[] memory defaultOperators) ERC777("${tokenName}", "${symbol}", defaultOperators) {
            _mint(msg.sender, ${totalSupply}, "", "");
        }
    }
    `;
}

// ERC-1400 Contract Generator
function generateERC1400Contract(rng) {
    const tokenName = `Token1400${getRandomInt(rng, 10000)}`;
    const symbol = `TKN1400${getRandomInt(rng, 100)}`;
    const totalSupply = getRandomInt(rng, 1e6) + 1e6;

    return `
    pragma solidity ^0.8.0;

    import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

    contract ${tokenName} is ERC20 {
        constructor() ERC20("${tokenName}", "${symbol}") {
            _mint(msg.sender, ${totalSupply});
        }
    }
    `;
}

// Generate a random contract based on the specified token standard
function generateRandomContract(rng, tokenStandard) {
    const contractGenerators = {
        'ERC-20': generateERC20Contract,
        'ERC-721': generateERC721Contract,
        'ERC-1155': generateERC1155Contract,
        'ERC-777': generateERC777Contract,
        'ERC-1400': generateERC1400Contract
    };

    if (contractGenerators[tokenStandard]) {
        return contractGenerators[tokenStandard](rng);
    } else {
        throw new Error(`Unsupported token standard: ${tokenStandard}`);
    }
}

function saveContract(contractCode, filename) {
    fs.writeFileSync(filename, contractCode, 'utf8');
}

function createArchive(output, files) {
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    const outputZip = fs.createWriteStream(output);

    return new Promise((resolve, reject) => {
        outputZip.on('close', resolve);
        archive.on('error', reject);

        archive.pipe(outputZip);

        files.forEach(file => {
            archive.file(file, { name: file.split('/').pop() });
        });

        archive.finalize();
    });
}

function validateContract(contractCode) {
    const input = {
        language: 'Solidity',
        sources: {
            'Contract.sol': {
                content: contractCode
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            }
        }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        for (const error of output.errors) {
            if (error.severity === 'error') {
                console.error(error.formattedMessage);
                return false;
            }
        }
    }

    return true;
}

const seed = process.env.SEED || 'default-seed';
const numberOfContracts = parseInt(process.env.NUM_CONTRACTS, 10) || 10;
const tokenStandard = process.env.TOKEN_STANDARD || 'ERC-20';
const outputZipFile = `./outputs/contracts_${tokenStandard}_${seed}.zip`;
const rng = seedrandom(seed);

if (!fs.existsSync('./contracts')) {
    fs.mkdirSync('./contracts');
}

if (!fs.existsSync('./outputs')) {
    fs.mkdirSync('./outputs');
}

const contractFiles = [];
let validContractsCount = 0;

while (validContractsCount < numberOfContracts) {
    try {
        const contractCode = generateRandomContract(rng, tokenStandard);
        const filename = `./contracts/${tokenStandard}_${validContractsCount}_seed_${seed}.sol`;

        if (validateContract(contractCode)) {
            saveContract(contractCode, filename);
            contractFiles.push(filename);
            validContractsCount++;
        }
    } catch (err) {
        console.error(`Error generating contract: ${err.message}`);
    }
}

createArchive(outputZipFile, contractFiles)
    .then(() => console.log(`Contracts archived in ${outputZipFile}`))
    .catch(err => console.error(`Error creating archive: ${err}`));
