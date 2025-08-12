import React from 'react';

const DocumentationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <div className="container mx-auto p-8 max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-blue-600 dark:text-blue-400">Link-in-bio-Hub Documentation</h1>
          <p className="text-xl mt-4 text-gray-600 dark:text-gray-400">Your guide to creating the perfect hub for your links.</p>
        </header>

        <main>
          <section className="mb-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-3xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600">1. Getting Started</h2>
            <p className="mb-4">Welcome to Link-in-bio-Hub! Creating your own page is simple:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the <strong>"Sign Up For Free"</strong> button on the homepage.</li>
              <li>Register with your email and choose a unique username.</li>
              <li>You'll be redirected to your brand new, customizable page!</li>
            </ol>
          </section>

          <section className="mb-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-3xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600">2. Customizing Your Page</h2>
            <p className="mb-4">Once you're logged in, you'll see the <strong>Edit Panel</strong>. Here you can:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Profile:</strong> Change your name, bio, and avatar.</li>
              <li><strong>Appearance:</strong> Choose themes, colors, fonts, and even a background image.</li>
              <li><strong>Links:</strong> Add, edit, and reorder your links and link groups.</li>
              <li><strong>Socials:</strong> Add links to all your social media profiles.</li>
            </ul>
          </section>

          <section className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-3xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600">3. The AI Features</h2>
            <p>Our integrated AI can help you with:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>AI-Powered Q&A:</strong> Visitors can ask an AI version of you questions based on your bio.</li>
              <li><strong>Automatic Link Grouping:</strong> Let our AI organize your links into logical groups.</li>
              <li><strong>Theme Generation:</strong> Describe a theme, and our AI will generate a color palette for you!</li>
            </ul>
          </section>
        </main>

        <footer className="text-center mt-12">
          <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">Back to Home</a>
        </footer>
      </div>
    </div>
  );
};

export default DocumentationPage;
