import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Rocket,
  Github,
  Settings,
  Globe
} from 'lucide-react';

const DeploymentGuide: React.FC = () => {
  const [copiedText, setCopiedText] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const deploymentSteps = [
    {
      title: "1. Prepare Your Repository",
      description: "Push your code to GitHub",
      commands: [
        "git add .",
        "git commit -m 'Ready for Vercel deployment'",
        "git push origin main"
      ]
    },
    {
      title: "2. Deploy to Vercel",
      description: "Connect your GitHub repo to Vercel",
      steps: [
        "Go to vercel.com and sign in with GitHub",
        "Click 'New Project'",
        "Import your repository",
        "Configure build settings (auto-detected)",
        "Add environment variables",
        "Deploy!"
      ]
    },
    {
      title: "3. Configure Environment Variables",
      description: "Set up your API endpoint in Vercel",
      envVars: [
        {
          key: "VITE_API_URL",
          value: "https://1treu6p055.execute-api.us-east-1.amazonaws.com/prod",
          description: "Your AWS Lambda API endpoint"
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full mb-4"
        >
          <Rocket size={20} />
          <span className="font-semibold">Deploy to Vercel</span>
        </motion.div>
        
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Deploy VoiceInsight to Production
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get your app live in minutes with Vercel's seamless deployment
        </p>
      </div>

      {/* Quick Deploy Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              🚀 One-Click Deploy
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Deploy directly from this repository to Vercel
            </p>
          </div>
          <a
            href="https://vercel.com/new/clone?repository-url=https://github.com/your-username/voice-insight&env=VITE_API_URL&envDescription=AWS%20Lambda%20API%20endpoint&envLink=https://docs.voiceinsight.com/deployment"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ExternalLink size={16} />
            <span>Deploy to Vercel</span>
          </a>
        </div>
      </motion.div>

      {/* Step-by-Step Guide */}
      <div className="space-y-6">
        {deploymentSteps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-effect rounded-xl p-6 ${
              currentStep === index ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {step.description}
                </p>
              </div>
              <button
                onClick={() => setCurrentStep(currentStep === index ? -1 : index)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Settings size={16} />
              </button>
            </div>

            <AnimatePresence>
              {currentStep === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Commands */}
                  {step.commands && (
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                        Commands to run:
                      </h4>
                      <div className="space-y-2">
                        {step.commands.map((command, cmdIndex) => (
                          <div
                            key={cmdIndex}
                            className="flex items-center justify-between bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm"
                          >
                            <code>{command}</code>
                            <button
                              onClick={() => copyToClipboard(command, `command-${cmdIndex}`)}
                              className="p-1 hover:bg-gray-800 rounded transition-colors"
                            >
                              {copiedText === `command-${cmdIndex}` ? (
                                <CheckCircle size={16} className="text-green-500" />
                              ) : (
                                <Copy size={16} />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Steps */}
                  {step.steps && (
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                        Follow these steps:
                      </h4>
                      <ol className="space-y-2">
                        {step.steps.map((stepItem, stepIndex) => (
                          <li
                            key={stepIndex}
                            className="flex items-start space-x-3"
                          >
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                              {stepIndex + 1}
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {stepItem}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Environment Variables */}
                  {step.envVars && (
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                        Environment Variables:
                      </h4>
                      <div className="space-y-3">
                        {step.envVars.map((envVar, envIndex) => (
                          <div
                            key={envIndex}
                            className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <code className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                                {envVar.key}
                              </code>
                              <button
                                onClick={() => copyToClipboard(envVar.value, `env-${envIndex}`)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                              >
                                {copiedText === `env-${envIndex}` ? (
                                  <CheckCircle size={16} className="text-green-500" />
                                ) : (
                                  <Copy size={16} />
                                )}
                              </button>
                            </div>
                            <div className="bg-gray-900 text-gray-300 p-2 rounded font-mono text-xs mb-2">
                              {envVar.value}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {envVar.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Status Check */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Globe className="text-purple-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Deployment Status
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-green-500" size={16} />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Backend API: Ready
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="text-yellow-500" size={16} />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Frontend: Pending deployment
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">API Endpoint:</span>
              <div className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                {import.meta.env.VITE_API_URL}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="https://vercel.com/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="glass-effect rounded-lg p-4 hover:bg-white/20 dark:hover:bg-black/20 transition-colors group"
        >
          <div className="flex items-center space-x-3 mb-2">
            <ExternalLink className="text-blue-500 group-hover:scale-110 transition-transform" size={20} />
            <h4 className="font-medium text-gray-800 dark:text-white">
              Vercel Docs
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Complete deployment documentation
          </p>
        </a>

        <a
          href="https://github.com/vercel/vercel/tree/main/examples"
          target="_blank"
          rel="noopener noreferrer"
          className="glass-effect rounded-lg p-4 hover:bg-white/20 dark:hover:bg-black/20 transition-colors group"
        >
          <div className="flex items-center space-x-3 mb-2">
            <Github className="text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform" size={20} />
            <h4 className="font-medium text-gray-800 dark:text-white">
              Examples
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Vercel deployment examples
          </p>
        </a>

        <div className="glass-effect rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <Rocket className="text-purple-500" size={20} />
            <h4 className="font-medium text-gray-800 dark:text-white">
              Support
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help? Check our documentation
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeploymentGuide;