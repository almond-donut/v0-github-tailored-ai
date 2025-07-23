// ULTRA-FAST repository manager - TARGET: 1-3 SECOND LOADING 🚀
class RepositoryManager {
  private static instance: RepositoryManager;
  private repositories: any[] = [];
  private lastFetch: number = 0;
  private isInitialized: boolean = false;
  private listeners: Set<(repos: any[]) => void> = new Set();
  private streamingListeners: Set<(repo: any) => void> = new Set();
  private isFetching: boolean = false;
  private loadingStartTime: number = 0;

  private constructor() {
    this.loadFromCache();
  }

  static getInstance(): RepositoryManager {
    if (!RepositoryManager.instance) {
      RepositoryManager.instance = new RepositoryManager();
    }
    return RepositoryManager.instance;
  }

  private loadFromCache() {
    // Skip on server side
    if (typeof window === 'undefined') return false;

    try {
      const cached = localStorage.getItem('github_repositories');
      const cacheTime = localStorage.getItem('github_repositories_time');
      
      if (cached && cacheTime) {
        const timeSinceCache = Date.now() - parseInt(cacheTime);
        // ULTRA AGGRESSIVE CACHING: Use cache if less than 1 hour old for maximum speed
        if (timeSinceCache < 3600000) {
          this.repositories = JSON.parse(cached);
          this.lastFetch = parseInt(cacheTime);
          this.isInitialized = true;
          console.log(`⚡ SINGLETON: Loaded ${this.repositories.length} repositories from cache`);
          this.notifyListeners();
          return true;
        }
      }
    } catch (error) {
      console.log('📁 SINGLETON: Cache load failed:', error);
    }
    return false;
  }

  private saveToCache() {
    // Skip on server side
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('github_repositories', JSON.stringify(this.repositories));
      localStorage.setItem('github_repositories_time', Date.now().toString());
      this.lastFetch = Date.now();
      console.log('💾 SINGLETON: Repositories cached');
    } catch (error) {
      console.log('📁 SINGLETON: Cache save failed:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.repositories]));
  }

  subscribe(listener: (repos: any[]) => void): () => void {
    this.listeners.add(listener);
    // Immediately provide current data
    listener([...this.repositories]);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  getRepositories(): any[] {
    return [...this.repositories];
  }

  // Add streaming listener for real-time updates
  addStreamingListener(listener: (repo: any) => void): () => void {
    this.streamingListeners.add(listener);
    return () => {
      this.streamingListeners.delete(listener);
    };
  }

  private notifyStreamingListeners(repo: any) {
    this.streamingListeners.forEach(listener => {
      try {
        listener(repo);
      } catch (error) {
        console.error('🚨 SINGLETON: Streaming listener error:', error);
      }
    });
  }

  async fetchRepositories(token: string, forceRefresh = false): Promise<void> {
    // ULTRA-FAST: If we have data and not forced, return immediately
    if (!forceRefresh && this.repositories.length > 0) {
      console.log('⚡ SINGLETON: Using existing data, INSTANT LOAD!');
      return;
    }

    // Prevent multiple simultaneous fetches
    if (this.isFetching) {
      console.log('⏳ SINGLETON: Fetch already in progress');
      return;
    }

    this.isFetching = true;
    this.loadingStartTime = Date.now();

    try {
      console.log('🚀 SINGLETON: ULTRA-FAST FETCH STARTING...');

      // PARALLEL REQUESTS for maximum speed
      const [userRepos, starredRepos] = await Promise.allSettled([
        fetch("https://api.github.com/user/repos?sort=updated&per_page=50", {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }),
        fetch("https://api.github.com/user/starred?per_page=20", {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        })
      ]);

      let repos: any[] = [];

      // Process user repos
      if (userRepos.status === 'fulfilled' && userRepos.value.ok) {
        const userReposData = await userRepos.value.json();
        repos = userReposData;

        // STREAMING: Notify as data arrives
        userReposData.forEach((repo: any, index: number) => {
          setTimeout(() => {
            this.notifyStreamingListeners(repo);
          }, index * 10); // Stagger for smooth streaming effect
        });
      }

      const fetchTime = Date.now() - this.loadingStartTime;

      console.log(`🚀 ULTRA-FAST: Loaded ${repos.length} repositories in ${fetchTime}ms`);

      // PERFORMANCE METRICS
      if (fetchTime < 1000) {
        console.log('🏆 PERFORMANCE: SUB-1-SECOND LOADING ACHIEVED!');
      } else if (fetchTime < 2000) {
        console.log('⚡ PERFORMANCE: SUB-2-SECOND LOADING!');
      } else if (fetchTime < 3000) {
        console.log('✅ PERFORMANCE: SUB-3-SECOND LOADING!');
      }

      this.repositories = repos;
      this.lastFetch = Date.now();
      this.isInitialized = true;
      this.saveToCache();
      this.notifyListeners();

    } catch (error) {
      console.error('❌ SINGLETON: Fetch error:', error);
      // Fallback to cached data if available
      if (this.repositories.length > 0) {
        console.log('🔄 SINGLETON: Using cached data as fallback');
        this.notifyListeners();
      }
      throw error;
    } finally {
      this.isFetching = false;
    }
  }

  isDataAvailable(): boolean {
    return this.repositories.length > 0;
  }

  getLastFetchTime(): number {
    return this.lastFetch;
  }

  // Background sync method
  async backgroundSync(token: string): Promise<void> {
    if (!this.isDataAvailable()) return;
    
    console.log('🔄 SINGLETON: Background sync starting...');
    try {
      await this.fetchRepositories(token, true);
    } catch (error) {
      console.log('⚠️ SINGLETON: Background sync failed:', error);
    }
  }
}

export const repositoryManager = RepositoryManager.getInstance();
