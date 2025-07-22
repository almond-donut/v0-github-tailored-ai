'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Github, Key, Shield, Zap, CheckCircle, ArrowRight, ArrowLeft, ExternalLink, Copy, Eye, EyeOff } from 'lucide-react'
import { useGitHubTokenSetup } from '@/hooks/use-github-token-setup'

interface GitHubTokenSetupModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GitHubTokenSetupModal({ isOpen, onClose }: GitHubTokenSetupModalProps) {
  const {
    token,
    isLoading,
    error,
    saveToken,
    clearToken,
    closeSetupModal,
    skipSetup
  } = useGitHubTokenSetup()

  const [currentStep, setCurrentStep] = useState(0)
  const [localToken, setLocalToken] = useState('')
  const [isTokenVisible, setIsTokenVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleClose = () => {
    setCurrentStep(0)
    setLocalToken('')
    closeSetupModal()
    onClose()
  }

  const nextStep = () => {
    setCurrentStep(prev => prev + 1)
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  const skipToAdvanced = () => {
    setCurrentStep(1)
  }

  const handleValidateAndSave = async () => {
    const success = await saveToken(localToken)
    if (success) {
      handleClose()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderStepIndicator = () => {
    const steps = ['Choose Path', 'Create Token', 'Set Permissions', 'Enter Token']
    
    return (
      <div className="flex items-center justify-center space-x-2 mb-6">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${index <= currentStep 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-500'
              }
            `}>
              {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${
                index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
          <Github className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Choose Your Experience</h3>
        <p className="text-gray-600 text-sm">
          How would you like to get started with GitHub integration?
        </p>
      </div>

      <div className="grid gap-4">
        {/* Quick Start Option */}
        <Card className="border-2 border-dashed border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 hover:border-green-400 transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-green-800">Quick Start</CardTitle>
                <CardDescription className="text-green-700">
                  Start exploring immediately with basic features
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                ✓ Repository browsing
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                ✓ Basic file viewing
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                ✓ Project overview
              </Badge>
            </div>
            <p className="text-xs text-green-700">
              Perfect for getting a feel for the platform. You can always upgrade later!
            </p>
            <Button 
              variant="default" 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleClose}
            >
              Start Exploring Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Advanced Setup Option */}
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-400 transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-blue-800">Advanced Setup</CardTitle>
                <CardDescription className="text-blue-700">
                  Unlock all features with GitHub token
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                ✓ Branch visualization
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                ✓ Commit history
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                ✓ Real-time sync
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                ✓ Advanced analytics
              </Badge>
            </div>
            <p className="text-xs text-blue-700">
              Takes 2 minutes to setup. Get the full power of GitHub integration.
            </p>
            <Button 
              variant="default" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={skipToAdvanced}
            >
              Setup GitHub Token
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center pt-2">
        <Button variant="ghost" size="sm" onClick={handleClose} className="text-gray-500 hover:text-gray-700">
          Skip for now
        </Button>
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
          <Key className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Create GitHub Token</h3>
        <p className="text-gray-600 text-sm">
          Let's create a personal access token to unlock advanced features
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-800">Step 1: Go to GitHub</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-blue-700">
            Click the button below to open GitHub's token creation page
          </p>
          <Button 
            variant="outline" 
            className="w-full border-blue-300 hover:bg-blue-100"
            onClick={() => window.open('https://github.com/settings/tokens/new', '_blank')}
          >
            <Github className="mr-2 h-4 w-4" />
            Open GitHub Token Page
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={nextStep}>
          I've opened GitHub
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Configure Token Permissions</h3>
        <p className="text-gray-600 text-sm">
          Set up the required permissions for your token
        </p>
      </div>

      <div className="space-y-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-800">Required Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Token name:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">GitHub Tailored AI</code>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Expiration:</span>
                <span className="text-sm text-gray-600">Choose your preference (30 days recommended)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800">Required Scopes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { scope: 'repo', description: 'Full control of private repositories' },
              { scope: 'read:user', description: 'Read user profile data' },
              { scope: 'read:org', description: 'Read organization membership' }
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-2 bg-white rounded border border-blue-200">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <code className="text-sm font-mono text-blue-800">{item.scope}</code>
                  <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Ready to generate?</span>
          </div>
          <p className="text-xs text-green-700">
            Once you've selected all scopes, click "Generate token" on GitHub
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={nextStep}>
          Token Generated
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
          <Key className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Enter Your Token</h3>
        <p className="text-gray-600 text-sm">
          Copy your token from GitHub and paste it below
        </p>
      </div>

      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Important Security Note</p>
              <p className="text-xs text-red-700 mt-1">
                Your token will be stored locally in your browser and never sent to our servers. 
                You can remove it anytime from settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <Label htmlFor="github-token" className="text-sm font-medium">
            GitHub Personal Access Token
          </Label>
          <div className="mt-2 relative">
            <Input
              id="github-token"
              type={isTokenVisible ? 'text' : 'password'}
              value={localToken}
              onChange={(e) => setLocalToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className={`pr-10 ${error ? 'border-red-300' : ''}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setIsTokenVisible(!isTokenVisible)}
            >
              {isTokenVisible ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> Your token should start with "ghp_" and be about 40 characters long
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={handleValidateAndSave}
          disabled={!localToken || isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Validating...
            </>
          ) : (
            <>
              Save & Complete
              <CheckCircle className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Github className="h-4 w-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">GitHub Integration</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                {currentStep === 0 && "Choose how you'd like to get started"}
                {currentStep === 1 && "Let's create your GitHub token"}
                {currentStep === 2 && "Configure the required permissions"}
                {currentStep === 3 && "Secure your access with the token"}
              </DialogDescription>
            </div>
          </div>
          {currentStep > 0 && renderStepIndicator()}
        </DialogHeader>

        <div className="mt-6">
          {currentStep === 0 && renderStep0()}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default GitHubTokenSetupModal
