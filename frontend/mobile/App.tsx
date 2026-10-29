import { useState } from "react";
import { Button, SafeAreaView, Text, TextInput, View } from "react-native";

const apiBase = "http://127.0.0.1:3000";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("Sign in to browse published videos.");

  async function signIn() {
    const response = await fetch(`${apiBase}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setMessage("Sign in failed");
      return;
    }
    const body = await response.json();
    setToken(body.accessToken);
    const me = await fetch(`${apiBase}/api/v1/me`, { headers: { authorization: `Bearer ${body.accessToken}` } });
    const account = await me.json();
    setRole(account.role);
    setMessage(`Signed in as ${account.role}. Resume uses last position. Completion is not inferred from it.`);
  }

  async function switchRole(next: "USER" | "CREATOR") {
    await fetch(`${apiBase}/api/v1/me/role`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: next }),
    });
    setRole(next);
  }

  return (
    <SafeAreaView>
      <View style={{ padding: 16, gap: 12 }}>
        <Text>SkillBite</Text>
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Button title="Sign in" onPress={() => void signIn()} />
        <Text>{message}</Text>
        {token ? <Text>Active role {role}</Text> : null}
        {token ? <Button title="Use as User" onPress={() => void switchRole("USER")} /> : null}
        {token ? <Button title="Use as Creator" onPress={() => void switchRole("CREATOR")} /> : null}
        <Text>Push permission denial stays on this screen and does not block playback. A simulator was not launched in this environment.</Text>
      </View>
    </SafeAreaView>
  );
}
