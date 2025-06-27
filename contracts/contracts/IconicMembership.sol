// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IconicMembership
 * @dev Este contrato permite que usuários se tornem "Iconic" mediante pagamento.
 * Ele registra quais usuários pagaram e emite um evento quando um usuário se torna Iconic.
 * Adicionada funcionalidade para o proprietário remover o status Iconic.
 */
contract IconicMembership {
    address public owner;
    uint256 public paymentAmount;
    mapping(address => bool) public isIconic;

    event UserBecameIconic(address indexed user);
    event UserIconicRemoved(address indexed user); // Novo evento
    event PaymentAmountUpdated(uint256 newAmount);
    event FundsWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Define o endereço do proprietário e o valor inicial do pagamento.
     * @param _initialPaymentAmount O valor inicial necessário para se tornar Iconic (em wei).
     */
    constructor(uint256 _initialPaymentAmount) {
        owner = msg.sender;
        paymentAmount = _initialPaymentAmount;
    }

    /**
     * @dev Permite que um usuário pague a taxa para se tornar Iconic.
     * O usuário deve enviar exatamente o valor definido em `paymentAmount`.
     * Emite um evento `UserBecameIconic` em caso de sucesso.
     */
    function becomeIconic() external payable {
        require(!isIconic[msg.sender], "User is already Iconic");
        require(msg.value == paymentAmount, "Incorrect payment amount");

        isIconic[msg.sender] = true;
        emit UserBecameIconic(msg.sender);
    }

    /**
     * @dev Permite que o proprietário remova o status Iconic de um usuário.
     * Apenas o proprietário pode chamar esta função.
     * Emite um evento `UserIconicRemoved`.
     * @param _user O endereço do usuário cujo status Iconic será removido.
     */
    function removeIconic(address _user) external onlyOwner {
        require(isIconic[_user], "User is not Iconic"); // Garante que o usuário era Iconic
        isIconic[_user] = false;
        emit UserIconicRemoved(_user);
    }

    /**
     * @dev Permite que o proprietário atualize o valor do pagamento.
     * Emite um evento `PaymentAmountUpdated`.
     * @param _newAmount O novo valor do pagamento (em wei).
     */
    function setPaymentAmount(uint256 _newAmount) external onlyOwner {
        paymentAmount = _newAmount;
        emit PaymentAmountUpdated(_newAmount);
    }

    /**
     * @dev Permite que o proprietário retire os fundos acumulados no contrato.
     * Emite um evento `FundsWithdrawn`.
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "Transfer failed.");

        emit FundsWithdrawn(owner, balance);
    }

    /**
     * @dev Função para verificar o status Iconic de um usuário.
     * @param _user O endereço do usuário a ser verificado.
     * @return bool Verdadeiro se o usuário for Iconic, falso caso contrário.
     */
    function checkIconicStatus(address _user) external view returns (bool) {
        return isIconic[_user];
    }

    /**
     * @dev Função de fallback para receber Ether diretamente (não recomendado para uso normal).
     */
    receive() external payable {}

    /**
     * @dev Função de fallback para lidar com chamadas para funções inexistentes.
     */
    fallback() external payable {}
}

