"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  hasError: boolean;
};

export function LoginForm({ hasError }: LoginFormProps) {
  const router = useRouter();
  const [openErrorModal, setOpenErrorModal] = useState(hasError);

  const closeErrorModal = () => {
    setOpenErrorModal(false);
    router.replace("/login");
  };

  return (
    <>
      <Card className="login-card border-white/80 bg-white/90 shadow-none">
        <CardContent className="pt-6">
          <form
            action="/auth/login"
            method="post"
            className="login-form"
            aria-label={"\uB85C\uADF8\uC778 \uACC4\uC815 \uC815\uBCF4"}
          >
            <div className="login-field-stack">
              <Label className="login-field-label" htmlFor="admin_id">
                {"\uAD00\uB9AC\uC790 \uC544\uC774\uB514"}
              </Label>
              <Input
                id="admin_id"
                name="admin_id"
                type="text"
                required
                autoComplete="username"
                placeholder={"\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uC138\uC694."}
                className="login-input"
              />
            </div>

            <div className="login-field-stack">
              <Label className="login-field-label" htmlFor="password">
                {"\uBE44\uBC00\uBC88\uD638"}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder={"\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD558\uC138\uC694."}
                className="login-input"
              />
            </div>

            <Button className="login-submit" size="lg" type="submit">
              {"\uB85C\uADF8\uC778"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Modal
        open={openErrorModal}
        title={"\uB85C\uADF8\uC778 \uC2E4\uD328"}
        description={"\uC544\uC774\uB514 \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."}
        onClose={closeErrorModal}
        confirmLabel={"\uD655\uC778"}
        cancelLabel={"\uB2EB\uAE30"}
      />
    </>
  );
}
