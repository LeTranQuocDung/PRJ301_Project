import 'package:flutter/material.dart';
import 'api_client.dart';

void main() {
  runApp(const LucyMobileApp());
}

class LucyMobileApp extends StatelessWidget {
  const LucyMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LUCY Mobile',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6366F1),
          primary: const Color(0xFF6366F1),
          secondary: const Color(0xFF10B981),
        ),
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const LoginScreen(),
        '/main': (context) => const MainNavigationScreen(),
      },
    );
  }
}

// LOGIN SCREEN
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  void _handleLogin() {
    setState(() => _isLoading = true);
    Future.delayed(const Duration(milliseconds: 800), () {
      setState(() => _isLoading = false);
      Navigator.pushReplacementNamed(context, '/main');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'LUCY Mobile',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF6366F1)),
              ),
              const SizedBox(height: 8),
              const Text('Learn languages collaboratively', style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 32),
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 24),
              _isLoading
                  ? const CircularProgressIndicator()
                  : SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), foregroundColor: Colors.white),
                        onPressed: _handleLogin,
                        child: const Text('Login'),
                      ),
                    ),
            ],
          ),
        ),
      ),
    );
  }
}

// MAIN TABS CONTAINER
class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  final List<Widget> _screens = [
    const HomeScreen(),
    const LiveRoomScreen(),
    const WalletScreen(),
    const PodcastScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        selectedItemColor: const Color(0xFF6366F1),
        unselectedItemColor: Colors.grey,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.menu_book), label: 'Explore'),
          BottomNavigationBarItem(icon: Icon(Icons.mic), label: 'Live Room'),
          BottomNavigationBarItem(icon: Icon(Icons.wallet), label: 'Wallet'),
          BottomNavigationBarItem(icon: Icon(Icons.radio), label: 'Podcasts'),
        ],
      ),
    );
  }
}

// EXPLORE / HOME SCREEN
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Explore Path', style: TextStyle(fontWeight: FontWeight.bold))),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          _buildLanguageCard('English (LISA)', 'Level 1 - 25', Colors.blue),
          const SizedBox(height: 12),
          _buildLanguageCard('Chinese (ZH)', 'Level 1 - 20', Colors.red),
          const SizedBox(height: 12),
          _buildLanguageCard('Japanese (JA)', 'Level 1 - 30', Colors.pink),
        ],
      ),
    );
  }

  Widget _buildLanguageCard(String title, String subtitle, Color color) {
    return Card(
      elevation: 2,
      child: ListTile(
        leading: CircleAvatar(backgroundColor: color.withValues(alpha: 0.2), child: Text(title.substring(0, 1), style: TextStyle(color: color))),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      ),
    );
  }
}

// LIVE ROOM SCREEN
class LiveRoomScreen extends StatelessWidget {
  const LiveRoomScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Live Audio Rooms', style: TextStyle(fontWeight: FontWeight.bold))),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.headset_mic, size: 64, color: Color(0xFF10B981)),
              const SizedBox(height: 16),
              const Text('Interactive Voice Discussions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('Speak anonymously to practice speaking skills with native speakers', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                icon: const Icon(Icons.add),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.white),
                onPressed: () {},
                label: const Text('Create New Voice Room'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// WALLET SCREEN (Premium & Balance)
class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final ApiClient _client = ApiClient();
  Map<String, dynamic>? _wallet;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchBalance();
  }

  void _fetchBalance() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final res = await _client.fetchWalletBalance(1);
      setState(() {
        _wallet = res;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load wallet balance';
        _isLoading = false;
      });
    }
  }

  void _handleSandboxTopUp() async {
    setState(() => _isLoading = true);
    try {
      final res = await _client.topUpWallet(1, 100000.0, 'demo_vnpay_sandbox');
      setState(() {
        if (_wallet != null) {
          final dynamic newBal = res['newBalance'] ?? (res['balance'] ?? 0.0);
          _wallet!['balance'] = (newBal is num) ? newBal.toDouble() : double.tryParse(newBal.toString()) ?? 0.0;
        }
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['isFallback'] == true
              ? 'Sandbox Top-Up simulated (+100,000 VND)!'
              : 'Sandbox Top-Up successful (+100,000 VND)!'),
        ),
      );
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to perform top-up')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wallet & Premium', style: TextStyle(fontWeight: FontWeight.bold))),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_errorMessage != null)
              Center(
                child: Column(
                  children: [
                    Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                    ElevatedButton(onPressed: _fetchBalance, child: const Text('Retry')),
                  ],
                ),
              )
            else if (_wallet != null)
              Card(
                color: const Color(0xFF6366F1),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Wallet Balance', style: TextStyle(color: Colors.white70)),
                          Text(
                            '${_wallet!['balance']} ${_wallet!['currency']}',
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ],
                      ),
                      ElevatedButton(
                        onPressed: _handleSandboxTopUp,
                        child: const Text('Top Up'),
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 24),
            const Text('Premium Perks', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Expanded(
              child: ListView(
                children: const [
                  ListTile(leading: Icon(Icons.star, color: Colors.amber), title: Text('Advanced Business English'), subtitle: Text('Locked')),
                  ListTile(leading: Icon(Icons.star, color: Colors.amber), title: Text('JLPT N5 Preparation'), subtitle: Text('Locked')),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// PODCASTS SCREEN
class PodcastScreen extends StatefulWidget {
  const PodcastScreen({super.key});

  @override
  State<PodcastScreen> createState() => _PodcastScreenState();
}

class _PodcastScreenState extends State<PodcastScreen> {
  final ApiClient _client = ApiClient();
  List<Map<String, dynamic>> _podcasts = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadPodcasts();
  }

  void _loadPodcasts() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final list = await _client.fetchPodcasts();
      setState(() {
        _podcasts = list;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load podcasts';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Audio Podcasts', style: TextStyle(fontWeight: FontWeight.bold))),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                      ElevatedButton(onPressed: _loadPodcasts, child: const Text('Retry')),
                    ],
                  ),
                )
              : _podcasts.isEmpty
                  ? const Center(child: Text('No podcasts found.'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(12.0),
                      itemCount: _podcasts.length,
                      itemBuilder: (context, index) {
                        final pod = _podcasts[index];
                        return Card(
                          child: ListTile(
                            leading: CircleAvatar(child: Text(pod['flagCode'] ?? '🎙')),
                            title: Text(pod['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text('${pod['episodes']} episodes · ${pod['lang']}'),
                            trailing: IconButton(
                              icon: const Icon(Icons.play_arrow, color: Colors.indigo),
                              onPressed: () {
                                showDialog(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    title: Text(pod['title'] ?? 'Podcast'),
                                    content: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.radio, size: 48, color: Colors.indigo),
                                        const SizedBox(height: 16),
                                        Text('Now Playing: ${pod['title']}', textAlign: TextAlign.center),
                                        const SizedBox(height: 4),
                                        Text('Language: ${pod['lang']} · ${pod['episodes']} eps', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                        const SizedBox(height: 16),
                                        const LinearProgressIndicator(value: 0.35),
                                        const SizedBox(height: 8),
                                        const Text('Playing podcast audio...', style: TextStyle(fontStyle: FontStyle.italic, fontSize: 11)),
                                      ],
                                    ),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(context),
                                        child: const Text('Stop'),
                                      )
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
