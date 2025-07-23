// GitHub API Integration for Real Actions
import { Octokit } from "@octokit/rest";

export interface CreateRepoParams {
  name: string;
  description?: string;
  private?: boolean;
  auto_init?: boolean;
  gitignore_template?: string;
  license_template?: string;
}

export interface CreateFileParams {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
  branch?: string;
}

interface DeleteRepoParams {
  owner: string;
  name: string;
}

export interface RepositoryComplexity {
  score: number;
  factors: {
    languages: number;
    fileCount: number;
    dependencies: number;
    architecture: number;
    documentation: number;
  };
  level: 'Simple' | 'Intermediate' | 'Complex' | 'Advanced';
  reasoning: string;
}

export class GitHubAPIService {
  private octokit: Octokit;
  private username: string;

  constructor(accessToken: string, username: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
    this.username = username;
  }

  // 🚀 CREATE NEW REPOSITORY
  async createRepository(params: CreateRepoParams) {
    try {
      console.log(`🚀 Creating repository: ${params.name}`);

      // Test if octokit is properly initialized
      console.log('🔍 Testing Octokit instance:', typeof this.octokit);
      console.log('🔍 Testing rest property:', typeof this.octokit.rest);
      console.log('🔍 Testing repos property:', typeof this.octokit.rest?.repos);

      const response = await this.octokit.request('POST /user/repos', {
        name: params.name,
        description: params.description || `Repository created by GitHub Tailored AI`,
        private: params.private || false,
        auto_init: params.auto_init || true,
        gitignore_template: params.gitignore_template,
        license_template: params.license_template,
      });

      console.log(`✅ Repository created: ${response.data.html_url}`);
      return {
        success: true,
        repository: response.data,
        url: response.data.html_url,
      };
    } catch (error: any) {
      console.error('❌ Failed to create repository:', error);
      return {
        success: false,
        error: error.message || 'Failed to create repository',
      };
    }
  }

  // 📄 CREATE FILE IN REPOSITORY
  async createFile(params: CreateFileParams) {
    try {
      console.log(`📄 Creating file: ${params.path} in ${params.owner}/${params.repo}`);
      
      const content = Buffer.from(params.content).toString('base64');
      
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: params.owner,
        repo: params.repo,
        path: params.path,
        message: params.message,
        content: content,
        branch: params.branch || 'main',
      });

      console.log(`✅ File created: ${response.data.content?.html_url}`);
      return {
        success: true,
        file: response.data,
        url: response.data.content?.html_url,
      };
    } catch (error: any) {
      console.error('❌ Failed to create file:', error);
      return {
        success: false,
        error: error.message || 'Failed to create file',
      };
    }
  }

  // 🗑️ DELETE REPOSITORY
  async deleteRepository(params: DeleteRepoParams) {
    try {
      console.log(`🗑️ Deleting repository: ${params.owner}/${params.name}`);

      const response = await this.octokit.request('DELETE /repos/{owner}/{repo}', {
        owner: params.owner,
        repo: params.name,
      });

      console.log(`✅ Repository deleted: ${params.owner}/${params.name}`);
      return {
        success: true,
        message: `Repository ${params.name} has been permanently deleted`,
      };
    } catch (error: any) {
      console.error('❌ Failed to delete repository:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete repository',
      };
    }
  }

  // 🧠 ANALYZE REPOSITORY COMPLEXITY
  async analyzeRepositoryComplexity(owner: string, repo: string): Promise<RepositoryComplexity> {
    try {
      console.log(`🧠 Analyzing complexity for: ${owner}/${repo}`);

      // Get repository details
      const repoData = await this.octokit.rest.repos.get({ owner, repo });
      
      // Get languages
      const languages = await this.octokit.rest.repos.listLanguages({ owner, repo });
      
      // Get repository contents
      const contents = await this.octokit.rest.repos.getContent({ 
        owner, 
        repo, 
        path: '' 
      });

      // Calculate complexity factors
      const languageCount = Object.keys(languages.data).length;
      const fileCount = Array.isArray(contents.data) ? contents.data.length : 1;
      
      // Check for package.json, requirements.txt, etc.
      let dependencyComplexity = 0;
      if (Array.isArray(contents.data)) {
        const hasPackageJson = contents.data.some(file => file.name === 'package.json');
        const hasRequirements = contents.data.some(file => file.name === 'requirements.txt');
        const hasCargoToml = contents.data.some(file => file.name === 'Cargo.toml');
        const hasPomXml = contents.data.some(file => file.name === 'pom.xml');
        
        dependencyComplexity = [hasPackageJson, hasRequirements, hasCargoToml, hasPomXml]
          .filter(Boolean).length * 2;
      }

      // Check for documentation
      const hasReadme = Array.isArray(contents.data) && 
        contents.data.some(file => file.name.toLowerCase().includes('readme'));
      const documentationScore = hasReadme ? 2 : 0;

      // Calculate architecture complexity (based on folder structure)
      const architectureScore = fileCount > 10 ? 3 : fileCount > 5 ? 2 : 1;

      // Calculate total complexity score
      const factors = {
        languages: languageCount,
        fileCount: Math.min(fileCount / 5, 5), // Normalize to max 5
        dependencies: dependencyComplexity,
        architecture: architectureScore,
        documentation: documentationScore,
      };

      const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
      
      // Determine complexity level
      let level: RepositoryComplexity['level'];
      let reasoning: string;

      if (totalScore <= 5) {
        level = 'Simple';
        reasoning = 'Basic project with minimal dependencies and straightforward structure';
      } else if (totalScore <= 10) {
        level = 'Intermediate';
        reasoning = 'Well-structured project with moderate complexity and dependencies';
      } else if (totalScore <= 15) {
        level = 'Complex';
        reasoning = 'Advanced project with multiple technologies and sophisticated architecture';
      } else {
        level = 'Advanced';
        reasoning = 'Highly complex project with extensive dependencies and advanced patterns';
      }

      console.log(`✅ Complexity analysis complete: ${level} (${totalScore})`);

      return {
        score: totalScore,
        factors,
        level,
        reasoning,
      };
    } catch (error: any) {
      console.error('❌ Failed to analyze repository complexity:', error);
      return {
        score: 0,
        factors: {
          languages: 0,
          fileCount: 0,
          dependencies: 0,
          architecture: 0,
          documentation: 0,
        },
        level: 'Simple',
        reasoning: 'Unable to analyze repository complexity',
      };
    }
  }

  // 📊 GET USER REPOSITORIES WITH COMPLEXITY
  async getRepositoriesWithComplexity() {
    try {
      console.log(`📊 Fetching repositories with complexity analysis...`);
      
      const repos = await this.octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
      });

      const repositoriesWithComplexity = await Promise.all(
        repos.data.map(async (repo) => {
          const complexity = await this.analyzeRepositoryComplexity(repo.owner.login, repo.name);
          return {
            ...repo,
            complexity,
          };
        })
      );

      console.log(`✅ Analyzed ${repositoriesWithComplexity.length} repositories`);
      return repositoriesWithComplexity;
    } catch (error: any) {
      console.error('❌ Failed to fetch repositories with complexity:', error);
      throw new Error('Failed to analyze repositories');
    }
  }
}

// 🎯 REPOSITORY SORTING UTILITIES
export class RepositorySorter {
  static sortByComplexity(repositories: any[], order: 'asc' | 'desc' = 'asc') {
    return repositories.sort((a, b) => {
      const scoreA = a.complexity?.score || 0;
      const scoreB = b.complexity?.score || 0;
      return order === 'asc' ? scoreA - scoreB : scoreB - scoreA;
    });
  }

  static sortForCV(repositories: any[]) {
    // Sort repositories in optimal order for CV:
    // 1. Complex/Advanced projects first
    // 2. Well-documented projects
    // 3. Recent projects
    // 4. Projects with good naming
    
    return repositories.sort((a, b) => {
      // Primary: Complexity score (higher first)
      const complexityDiff = (b.complexity?.score || 0) - (a.complexity?.score || 0);
      if (complexityDiff !== 0) return complexityDiff;
      
      // Secondary: Documentation (has README)
      const aHasReadme = a.complexity?.factors?.documentation > 0 ? 1 : 0;
      const bHasReadme = b.complexity?.factors?.documentation > 0 ? 1 : 0;
      const docDiff = bHasReadme - aHasReadme;
      if (docDiff !== 0) return docDiff;
      
      // Tertiary: Recent updates
      const aDate = new Date(a.updated_at).getTime();
      const bDate = new Date(b.updated_at).getTime();
      return bDate - aDate;
    });
  }

  static generateCVRecommendations(repositories: any[]) {
    const sorted = this.sortForCV(repositories);
    const recommendations = [];

    // Top 5 repositories for CV
    const topRepos = sorted.slice(0, 5);
    
    recommendations.push({
      type: 'cv_order',
      title: '🎯 Recommended CV Order',
      description: 'These repositories should be featured prominently on your CV',
      repositories: topRepos.map((repo, index) => ({
        position: index + 1,
        name: repo.name,
        reason: this.getRecommendationReason(repo, index),
        complexity: repo.complexity?.level || 'Unknown',
      })),
    });

    // Improvement suggestions
    const improvements = this.generateImprovementSuggestions(repositories);
    recommendations.push(...improvements);

    return recommendations;
  }

  private static getRecommendationReason(repo: any, position: number): string {
    const complexity = repo.complexity?.level || 'Unknown';
    const hasReadme = repo.complexity?.factors?.documentation > 0;
    
    if (position === 0) {
      return `Lead project - ${complexity} complexity showcases your technical skills`;
    } else if (complexity === 'Advanced' || complexity === 'Complex') {
      return `Demonstrates advanced technical capabilities (${complexity})`;
    } else if (hasReadme) {
      return `Well-documented project shows professionalism`;
    } else {
      return `Recent project demonstrates current activity`;
    }
  }

  private static generateImprovementSuggestions(repositories: any[]) {
    const suggestions = [];
    
    // Check for repositories without README
    const noReadme = repositories.filter(repo => 
      repo.complexity?.factors?.documentation === 0
    );
    
    if (noReadme.length > 0) {
      suggestions.push({
        type: 'improvement',
        title: '📝 Add Documentation',
        description: 'These repositories would benefit from README files',
        repositories: noReadme.slice(0, 3).map(repo => ({
          name: repo.name,
          suggestion: 'Add a comprehensive README with project description, setup instructions, and usage examples',
        })),
      });
    }

    return suggestions;
  }
}
