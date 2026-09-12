<script lang="ts">
  import LoginForm from "$lib/components/login-form.svelte";
</script>
<div class="grid min-h-svh lg:grid-cols-2">
  <div class="flex flex-col gap-4 p-6 md:p-10">
    <div class="flex justify-center gap-2 md:justify-start">
      <a href="##" class="flex items-center gap-2 font-medium">
        <div
          class="size-12"
        >
          <img
            src="/src/lib/assets/levelecturelogo.png"
            alt="auth red abstract"
            class="h-full w-full object-cover"
          />
        </div>
      </a>
    </div>
    <div class="flex flex-1 items-center justify-center">
      <div class="w-full max-w-xs">
        <LoginForm />
      </div>
    </div>
  </div>
  <div class="-z-10 lg:relative lg:block">
    <img
      src="/src/lib/assets/authimage.png"
      alt="auth red abstract"
      class="absolute inset-0 h-full w-full object-cover opacity-20 lg:opacity-100"
    />
  </div>
</div>