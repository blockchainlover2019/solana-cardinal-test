### Create Time-Based Rental
  - CreateMintManager (Cardinal_token_manager)
    <b> Signer:  Payer, Freeze Authority </b> 
    > create mint manager account

    > change mint authority & freze authority to mint manager account
  - Init (Cardinal_token_manager)
    <b> Signer:  Issuer, Payer </b> 
    > create token manager account

    > create mint counter account
  - Init (Cardinal_time_invalidator)
    <b> Signer:  Issuer, Payer </b> 
    > create time invalidator account
  - AddInvalidator (Cardinal_token_manager)
    <b> Signer:  Issuer </b> 
  - Create Assocatiated Account
    <b> Signer:  Authority = Issuer </b> 
    > creat ata of token amanger account with rentalMint as a mint
  - Issue (Cardinal_token_manager)
    > transfer token to token manager token account

### Invalidate
  - Invalidate (Cardinal_time_invalidator)
    > invalidate (Cardinal_token_manager)
    <b> Signer:  Collector </b> 
    > Token Transfer : return to user wallet
    > Close Account : close token account
  - Close (Cardinal_time_invalidator)
    <b> Signer:  closer, collector </b> 
    > close token manager account and time invalidator account

### Claim
  - Create Associated Account
    > create ata of recipient
  - Claim (Cardinal_token_manager)
    > transfer token from token_manager token account to created recipient token account
    > delegate recpient_token_account to token_manager (approve)
    > freeze recpient_token_account with mint_manager as freeze_authority

### Invalidate After Claim
  - Invalidate (Cardinal_time_invalidator)
    > invalidate (Cardinal_token_manager)
    <b> Signer:  Collector </b> 
    > Thaw Account: thaw frozen recpient_token_account with mint_manager (freeze_authority)
    > Token Transfer : return token from recpient_token_account to issuer wallet
    > Close Account : close token account
  - Close (Cardinal_time_invalidator)
    <b> Signer:  closer, collector </b> 
    > close token manager account and time invalidator account

### Create Time-based Rental with MasterEdition NFT
  - Init (Cardinal_token_manager)
    <b> Signer:  Issuer, Payer </b> 
    > create token manager account

    > create mint counter account
  - Init (Cardinal_time_invalidator)
    <b> Signer:  Issuer, Payer </b> 
    > create time invalidator account
  - AddInvalidator (Cardinal_token_manager)
    <b> Signer:  Issuer </b> 
  - Create Assocatiated Account
    <b> Signer:  Authority = Issuer </b> 
    > creat ata of token amanger account with rentalMint as a mint
  - Issue (Cardinal_token_manager)
    > transfer token to token manager token account

### Claim with MasterEdition NFT
  - Create Associated Account
    > create ata of recipient
  - Claim (Cardinal_token_manager)
    > transfer token from token_manager token account to created recipient token account
    > delegate recpient_token_account to token_manager (approve)
    > Metaplex Token Metadata: Freeze Delegated Account
    > freeze recpient_token_account with edition pda as a freeze_authority

### Invalidate After Claim with MasterEdition NFT
  - Invalidate (Cardinal_time_invalidator)
    > invalidate (Cardinal_token_manager)
    <b> Signer:  Collector </b> 
    > Metaplex Token Metadata: Thaw Delegated Account
    > Thaw Account: thaw frozen recpient_token_account with mint_manager (freeze_authority)
    > Token Transfer : return token from recpient_token_account to issuer wallet
    > Close Account : close token account
  - Close (Cardinal_time_invalidator)
    <b> Signer:  closer, collector </b> 
    > close token manager account and time invalidator account