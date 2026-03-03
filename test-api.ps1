# test-api.ps1
$ErrorActionPreference = "Stop"

# =============================
# CONFIG
# =============================
$BASE_URL = "http://localhost:8787"
$EMAIL    = "dony@email.com"

# Se quiser forçar um pizzaria_id (ex: pra testar outra), coloque aqui.
# Se deixar vazio, ele usa o pizzaria_id vindo do login.
$FORCE_PIZZARIA_ID = ""

# =============================
# HELPERS
# =============================
function ApiPostJson($url, $headers, $obj) {
  $json = ($obj | ConvertTo-Json -Depth 10)
  return Invoke-RestMethod -Method Post -Uri $url -Headers $headers -ContentType "application/json" -Body $json
}

function ApiGet($url, $headers) {
  return Invoke-RestMethod -Method Get -Uri $url -Headers $headers
}

function PrintTitle($text) {
  Write-Host ""
  Write-Host "=============================" -ForegroundColor Cyan
  Write-Host $text -ForegroundColor Cyan
  Write-Host "=============================" -ForegroundColor Cyan
}

# =============================
# 1) LOGIN
# =============================
PrintTitle "1) LOGIN"
$loginUrl = "$BASE_URL/api/auth/login"

try {
  $loginResp = Invoke-RestMethod -Method Post -Uri $loginUrl -ContentType "application/json" -Body ('{"email":"' + $EMAIL + '"}')
} catch {
  Write-Host "❌ Falhou login: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
    Write-Host "Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor DarkRed
  }
  exit 1
}

$PIZZARIA_ID = if ($FORCE_PIZZARIA_ID) { $FORCE_PIZZARIA_ID } else { $loginResp.pizzaria_id }
$ROLE = $loginResp.role
$NOME = $loginResp.nome

Write-Host "✅ Logado: $NOME | role=$ROLE | pizzaria_id=$PIZZARIA_ID" -ForegroundColor Green

# Headers padrão das rotas protegidas
$authHeaders = @{
  "x-pizzaria-id" = $PIZZARIA_ID
  "x-user-role"   = $ROLE
}

# =============================
# 2) POST FORNECEDOR (opcional)
# =============================
PrintTitle "2) POST FORNECEDOR (opcional)"
$fornecedorUrl = "$BASE_URL/api/fornecedores"

$novoFornecedor = @{
  nome_fantasia       = "Mercado Teste"
  razao_social        = "Mercado Teste LTDA"
  telefone_whatsapp   = ""
  categoria_principal = "mercado"
  email               = ""
  nome_contato        = "Carlos"
}

try {
  $respFornecedor = ApiPostJson $fornecedorUrl $authHeaders $novoFornecedor
  Write-Host "✅ POST fornecedor OK: $($respFornecedor | ConvertTo-Json -Depth 10)" -ForegroundColor Green
} catch {
  Write-Host "⚠️ POST fornecedor falhou (talvez você não queira inserir sempre): $($_.Exception.Message)" -ForegroundColor Yellow
  if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
    Write-Host "Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor DarkYellow
  }
}

# =============================
# 3) LISTAR FORNECEDORES
# =============================
PrintTitle "3) GET FORNECEDORES"
try {
  $listaFornecedores = ApiGet $fornecedorUrl $authHeaders
  $listaFornecedores | ConvertTo-Json -Depth 10
} catch {
  Write-Host "❌ GET fornecedores falhou: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
    Write-Host "Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor DarkRed
  }
}

# =============================
# 4) POST PRODUTO (opcional)
# =============================
PrintTitle "4) POST PRODUTO (opcional)"
$produtoUrl = "$BASE_URL/api/produtos"

$novoProduto = @{
  nome_produto     = "Mussarela"
  categoria_produto= "queijos"
  unidade_medida   = "kg"
}

try {
  $respProduto = ApiPostJson $produtoUrl $authHeaders $novoProduto
  Write-Host "✅ POST produto OK: $($respProduto | ConvertTo-Json -Depth 10)" -ForegroundColor Green
} catch {
  Write-Host "⚠️ POST produto falhou (tabela pode não existir ainda ou você não quer inserir sempre): $($_.Exception.Message)" -ForegroundColor Yellow
  if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
    Write-Host "Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor DarkYellow
  }
}

# =============================
# 5) LISTAR PRODUTOS
# =============================
PrintTitle "5) GET PRODUTOS"
try {
  $listaProdutos = ApiGet $produtoUrl $authHeaders
  $listaProdutos | ConvertTo-Json -Depth 10
} catch {
  Write-Host "❌ GET produtos falhou: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
    Write-Host "Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor DarkRed
  }
}

# =============================
# 6) LISTAR INBOX (IA)
# =============================
PrintTitle "6) GET INBOX (IA)"
$inboxUrl = "$BASE_URL/api/ia/inbox"

try {
  $inbox = ApiGet $inboxUrl $authHeaders
  $inbox | ConvertTo-Json -Depth 10
} catch {
  Write-Host "❌ GET inbox falhou: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
    Write-Host "Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor DarkRed
  }
}

Write-Host ""
Write-Host "✅ Fim dos testes." -ForegroundColor Green