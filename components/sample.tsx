"use client"

/**
 * ============================================================================
 * IOTA DAPP INTEGRATION COMPONENT
 * ============================================================================
 * 
 * This is the main integration component for your IOTA dApp.
 * 
 * All the contract logic is in hooks/useContract.ts
 * 
 * To customize your dApp, modify this file.
 * 
 * ============================================================================
 */

import { useCurrentAccount } from "@iota/dapp-kit"
import { useContract } from "@/hooks/useContract"
import { Button, Container, Flex, Heading, Text } from "@radix-ui/themes"
import ClipLoader from "react-spinners/ClipLoader"

const SampleIntegration = () => {
  const currentAccount = useCurrentAccount()
  const { data, actions, state, objectId, isOwner, objectExists, hasValidData } = useContract()
  
  const isConnected = !!currentAccount

  if (!isConnected) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ maxWidth: "500px", width: "100%" }}>
          <Heading size="6" style={{ marginBottom: "1rem" }}>IOTA dApp</Heading>
          <Text>Please connect your wallet to interact with the contract.</Text>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", padding: "1rem", background: "var(--gray-a2)" }}>
      <Container style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Heading size="6" style={{ marginBottom: "2rem" }}>IOTA Counter dApp</Heading>

        {!objectId ? (
          <div>
            <Button
              size="3"
              onClick={actions.createObject}
              disabled={state.isPending}
            >
              {state.isPending ? (
                <>
                  <ClipLoader size={16} style={{ marginRight: "8px" }} />
                  Creating...
                </>
              ) : (
                "Create Counter"
              )}
            </Button>
            {state.error && (
              <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--red-a3)", borderRadius: "8px" }}>
                <Text style={{ color: "var(--red-11)" }}>
                  Error: {(state.error as Error)?.message || String(state.error)}
                </Text>
              </div>
            )}
          </div>
        ) : (
          <div>
            {state.isLoading && !data ? (
              <Text>Loading object...</Text>
            ) : state.error ? (
              <div style={{ padding: "1rem", background: "var(--red-a3)", borderRadius: "8px" }}>
                <Text style={{ color: "var(--red-11)", display: "block", marginBottom: "0.5rem" }}>
                  Error loading object
                </Text>
                <Text size="2" style={{ color: "var(--red-11)" }}>
                  {state.error.message || "Object not found or invalid"}
                </Text>
                <Text size="1" style={{ color: "var(--gray-a11)", marginTop: "0.5rem", display: "block" }}>
                  Object ID: {objectId}
                </Text>
                <Button
                  size="2"
                  variant="soft"
                  onClick={actions.clearObject}
                  style={{ marginTop: "1rem" }}
                >
                  Clear & Create New
                </Button>
              </div>
            ) : objectExists && !hasValidData ? (
              <div style={{ padding: "1rem", background: "var(--yellow-a3)", borderRadius: "8px" }}>
                <Text style={{ color: "var(--yellow-11)" }}>
                  Object found but data structure is invalid. Please check the contract structure.
                </Text>
                <Text size="1" style={{ color: "var(--gray-a11)", marginTop: "0.5rem", display: "block" }}>
                  Object ID: {objectId}
                </Text>
              </div>
            ) : data ? (
              <div>
                <div style={{ marginBottom: "1rem", padding: "1rem", background: "var(--gray-a3)", borderRadius: "8px" }}>
                  <Text size="2" style={{ display: "block", marginBottom: "0.5rem" }}>Counter Value</Text>
                  <Heading size="8">{data.value}</Heading>
                  <Text size="1" style={{ color: "var(--gray-a11)", marginTop: "0.5rem", display: "block" }}>
                    Object ID: {objectId}
                  </Text>
                </div>

                <Flex gap="2" style={{ marginBottom: "1rem" }}>
                  <Button
                    onClick={actions.increment}
                    disabled={state.isLoading || state.isPending}
                  >
                    {state.isLoading || state.isPending ? (
                      <ClipLoader size={16} />
                    ) : (
                      "Increment"
                    )}
                  </Button>
                  {isOwner && (
                    <Button
                      onClick={actions.reset}
                      disabled={state.isLoading || state.isPending}
                    >
                      {state.isLoading || state.isPending ? (
                        <ClipLoader size={16} />
                      ) : (
                        "Reset"
                      )}
                    </Button>
                  )}
                </Flex>

                {state.hash && (
                  <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--gray-a3)", borderRadius: "8px" }}>
                    <Text size="1" style={{ display: "block", marginBottom: "0.5rem" }}>Transaction Hash</Text>
                    <Text size="2" style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{state.hash}</Text>
                    {state.isConfirmed && (
                      <Text size="2" style={{ color: "green", marginTop: "0.5rem", display: "block" }}>
                        Transaction confirmed!
                      </Text>
                    )}
                  </div>
                )}

                {state.error && (
                  <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--red-a3)", borderRadius: "8px" }}>
                    <Text style={{ color: "var(--red-11)" }}>
                      Error: {(state.error as Error)?.message || String(state.error)}
                    </Text>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "1rem", background: "var(--yellow-a3)", borderRadius: "8px" }}>
                <Text style={{ color: "var(--yellow-11)" }}>Object not found</Text>
                <Text size="1" style={{ color: "var(--gray-a11)", marginTop: "0.5rem", display: "block" }}>
                  Object ID: {objectId}
                </Text>
                <Button
                  size="2"
                  variant="soft"
                  onClick={actions.clearObject}
                  style={{ marginTop: "1rem" }}
                >
                  Clear & Create New
                </Button>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  )
}

export default SampleIntegration
