$ErrorActionPreference = "Continue"

# Fix Auth.tsx - remove useNavigate
$file = "src/components/Auth/Auth.tsx"
$content = Get-Content $file -Raw
$content = $content -replace "import React, { useState, useEffect } from 'react';\r\nimport { useNavigate } from 'react-router-dom';", "import React, { useState, useEffect } from 'react';"
Set-Content $file -Value $content -NoNewline

# Fix MindmapViewer.tsx - remove useMemo
$file = "src/components/MindmapViewer.tsx"
$content = Get-Content $file -Raw
$content = $content -replace ", useMemo", ""
Set-Content $file -Value $content -NoNewline

# Fix Sidebar.tsx - remove ChevronRight
$file = "src/components/Sidebar/Sidebar.tsx"
$content = Get-Content $file -Raw
$content = $content -replace ", ChevronRight", ""
Set-Content $file -Value $content -NoNewline

# Fix Chat.tsx - add optional chaining for message.images
$file = "src/pages/Chat/Chat.tsx"
$content = Get-Content $file -Raw
$content = $content -replace "message\.images\.length", "message?.images?.length"
Set-Content $file -Value $content -NoNewline

# Fix MindmapModal.tsx - remove Minimize2
$file = "src/pages/Chat/components/modals/MindmapModal.tsx"
$content = Get-Content $file -Raw
$content = $content -replace ", Minimize2", ""
Set-Content $file -Value $content -NoNewline

# Fix Quiz components - remove unused React imports
$quizFiles = @(
    "src/pages/Chat/components/QuizModal/QuizModal.tsx",
    "src/pages/Chat/components/QuizModal/QuizNavigation.tsx",
    "src/pages/Chat/components/QuizModal/QuizQuestion.tsx",
    "src/pages/Chat/components/QuizModal/QuizResults.tsx",
    "src/pages/Faculty/QuestionAnalytics/QuestionStats.tsx"
)

foreach ($file in $quizFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace "import React from 'react';\r\n", ""
        $content = $content -replace "import React from 'react';\n", ""
        Set-Content $file -Value $content -NoNewline
    }
}

Write-Host "Fixed unused imports!"
