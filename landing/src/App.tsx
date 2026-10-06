import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Features } from './components/Features'
import { HowItWorks } from './components/HowItWorks'
import { CtaBanner } from './components/CtaBanner'
import { Footer } from './components/Footer'

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CtaBanner />
      </main>
      <Footer />
    </>
  )
}

export default App
