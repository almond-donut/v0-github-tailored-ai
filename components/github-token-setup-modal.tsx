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
import { ScrollArea } from '@/components/ui/scroll-area'

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
                ? 'bg-neutral-300 text-neutral-900' 
                : 'bg-neutral-800 text-neutral-400'
              }
            `}>
              {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${
                index < currentStep ? 'bg-neutral-300' : 'bg-neutral-800'
              }`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderStep0 = () => {
    const Feature = ({ children }: { children: React.ReactNode }) => (
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-neutral-500" />
        <span className="text-slate-300 text-sm">{children}</span>
      </div>
    )

    return (
      <div className="space-y-8 p-2">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center">
            <Github className="h-10 w-10 text-slate-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-100">Choose Your Experience</h3>
            <p className="text-slate-400 mt-2">
              How would you like to get started with GitHub integration?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Start Option */}
          <div
            onClick={handleClose}
            className="bg-slate-900 border border-neutral-700 hover:border-neutral-500 rounded-xl p-6 space-y-6 transition-all cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="bg-neutral-800/50 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-neutral-400" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-400 text-lg">Quick Start</h4>
                <p className="text-slate-400 text-sm">Start exploring immediately</p>
              </div>
            </div>
            <div className="space-y-3">
              <Feature>Repository browsing</Feature>
              <Feature>Basic file viewing</Feature>
              <Feature>Project overview</Feature>
            </div>
            <p className="text-xs text-slate-500">
              Perfect for a quick look. You can always set up advanced features later.
            </p>
            <Button
              variant="default"
              className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-100 font-bold py-3"
            >
              Start Exploring
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Advanced Setup Option */}
          <div
            onClick={skipToAdvanced}
            className="bg-slate-900 border border-neutral-700 hover:border-neutral-500 rounded-xl p-6 space-y-6 transition-all cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="bg-neutral-800/50 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-neutral-400" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-400 text-lg">Advanced Setup</h4>
                <p className="text-slate-400 text-sm">Unlock all features</p>
              </div>
            </div>
            <ScrollArea className="h-[120px] w-full rounded-md p-4">
              <div className="space-y-3">
                <Feature>Branch visualization</Feature>
                <Feature>Commit history</Feature>
                <Feature>Real-time sync</Feature>
                <Feature>Advanced analytics</Feature>
                <Feature>AI-powered code analysis</Feature>
                <Feature>Automated README generation</Feature>
              </div>
            </ScrollArea>
            <p className="text-xs text-slate-500">
              Get the full power of GitHub integration. Setup takes only 2 minutes.
            </p>
            <Button
              variant="default"
              className="w-full bg-white hover:bg-gray-200 text-slate-900 font-bold py-3"
            >
              Setup GitHub Token
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-center">
          <Button variant="link" size="sm" onClick={handleClose} className="text-slate-500 hover:text-slate-300">
            Skip for now
          </Button>
        </div>
      </div>
    )
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          <Key className="h-6 w-6 text-neutral-300" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Create GitHub Token</h3>
        <p className="text-gray-400 text-sm">
          Let's create a personal access token to unlock advanced features
        </p>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300">Step 1: Go to GitHub</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-neutral-400">
            Click the button below to open GitHub's token creation page
          </p>
          <Button 
            variant="outline" 
            className="w-full border-neutral-700 hover:bg-neutral-800"
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
        <div className="mx-auto w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-neutral-300" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Configure Token Permissions</h3>
        <p className="text-gray-400 text-sm">
          Set up the required permissions for your token
        </p>
      </div>

      <div className="space-y-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300">Required Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-neutral-500" />
                <span className="text-sm font-medium">Token name:</span>
                <code className="bg-neutral-800 px-2 py-1 rounded text-xs">GitHub Tailored AI</code>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-neutral-500" />
                <span className="text-sm font-medium">Expiration:</span>
                <span className="text-sm text-gray-400">Choose your preference (30 days recommended)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300">Required Scopes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { scope: 'repo', description: 'Full control of private repositories' },
              { scope: 'read:user', description: 'Read user profile data' },
              { scope: 'read:org', description: 'Read organization membership' }
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-2 bg-neutral-950 rounded border border-neutral-800">
                <CheckCircle className="h-4 w-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                <div>
                  <code className="text-sm font-mono text-neutral-300">{item.scope}</code>
                  <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-300">Ready to generate?</span>
          </div>
          <p className="text-xs text-neutral-400">
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
        <div className="mx-auto w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          <Key className="h-6 w-6 text-neutral-300" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Enter Your Token</h3>
        <p className="text-gray-400 text-sm">
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

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
          <p className="text-xs text-neutral-400">
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
          className="bg-neutral-300 hover:bg-neutral-400 text-neutral-900"
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
      <DialogContent className="sm:max-w-4xl bg-[#0D1117] text-gray-300 border-slate-800 p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className={currentStep > 0 ? "p-6" : ""}>
            <DialogHeader className="space-y-3">
              {currentStep > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center">
                  <Github className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl text-white">GitHub Integration</DialogTitle>
                  <DialogDescription className="text-sm text-gray-400">
                    {currentStep === 1 && "Let's create your GitHub token"}
                    {currentStep === 2 && "Configure the required permissions"}
                    {currentStep === 3 && "Secure your access with the token"}
                  </DialogDescription>
                </div>
              </div>
            )}
            {currentStep > 0 && renderStepIndicator()}
          </DialogHeader>

          <div className={currentStep > 0 ? "mt-6" : ""}>
            {currentStep === 0 && renderStep0()}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default GitHubTokenSetupModal
