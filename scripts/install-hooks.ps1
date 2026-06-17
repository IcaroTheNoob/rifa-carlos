#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Instala os Git hooks de segurança do projeto.
.DESCRIPTION
  Configura o Git para usar os hooks em .githooks/ em vez de .git/hooks/.
  Isso permite que os hooks sejam versionados no repositório.
#>

$ErrorActionPreference = "Stop"

Write-Host "🔧 Instalando Git hooks de segurança..." -ForegroundColor Cyan

# Configurar Git para usar .githooks/ como diretório de hooks
git config core.hooksPath .githooks

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ hooksPath configurado para .githooks/" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Testando o hook..." -ForegroundColor Cyan

    # Criar arquivo temporário para testar o hook
    $testFile = ".hook-test-temp.txt"
    Set-Content -Path $testFile -Value "const exemplo_var = 'exemplo_valor'; const url = 'meu_host_aqui';"

    try {
        git add $testFile 2>&1 | Out-Null
        $result = git commit -m "test: hook security (should block)" 2>&1
        Write-Host "  Resultado: $result" -ForegroundColor Yellow
        # Se chegou aqui é porque o commit passou (não deveria)
        git reset HEAD $testFile 2>&1 | Out-Null
        Remove-Item $testFile -Force
        Write-Host "  ⚠️  O hook NÃO bloqueou o commit de teste." -ForegroundColor Yellow
        Write-Host "  Verifique a configuração do execution policy do PowerShell." -ForegroundColor Yellow
    }
    catch {
        Write-Host "  ✅ Hook bloqueou corretamente o arquivo malicioso!" -ForegroundColor Green
        git reset HEAD $testFile 2>&1 | Out-Null
        Remove-Item $testFile -Force
    }

    Write-Host ""
    Write-Host "✅ Instalação concluída!" -ForegroundColor Green
    Write-Host "  O hook de segurança será executado automaticamente em cada 'git commit'."
}
else {
    Write-Host "  ❌ Falha ao configurar hooksPath." -ForegroundColor Red
    exit 1
}
