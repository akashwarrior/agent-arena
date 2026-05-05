import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function Login() {

  const handleLogin = async () => {
    // TODO: replace tmeplate code this
    authClient.signIn.email({
      email: "email@gmail.com",
      password: "randompassword",
      callbackURL: "/",
      fetchOptions: {
        onSuccess(context) {
          console.log(context)
        },
        onError(context) {
          console.log(context)
        },
        onRequest(context) {
          console.log(context)
        },
      }
    })
  }


  return (
    <div>
      login here
      <Button onClick={handleLogin}>
      </Button>
    </div>
  );
}
