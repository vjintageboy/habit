"use client"

import { Card, Flex, Heading, Text, Button } from "@radix-ui/themes"
import { useNetworkVariable } from "@/lib/config"

export function DeployWarning() {
  const packageId = useNetworkVariable("packageId")

  if (packageId) {
    return null // Don't show warning if package ID is configured
  }

  return (
    <Card style={{ padding: "1.5rem", marginBottom: "2rem", background: "var(--yellow-a3)" }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <Text size="6">⚠️</Text>
          <Heading size="5">Contract Not Deployed</Heading>
        </Flex>
        
        <Text size="3">
          The habit tracker contract hasn't been deployed yet. You need to deploy it before you can create habits.
        </Text>
        
        <Flex direction="column" gap="2">
          <Text size="2" weight="bold">To deploy the contract:</Text>
          <Flex direction="column" gap="1" style={{ paddingLeft: "1rem" }}>
            <Text size="2">1. Open your terminal</Text>
            <Text size="2">2. Run: <code style={{ background: "var(--gray-a5)", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>npm run iota-deploy</code></Text>
            <Text size="2">3. Wait for deployment to complete</Text>
            <Text size="2">4. Refresh this page</Text>
          </Flex>
        </Flex>

        <Text size="1" color="gray">
          This will automatically build and deploy your Move contract to the IOTA testnet, 
          and configure the package ID in your app.
        </Text>
      </Flex>
    </Card>
  )
}

