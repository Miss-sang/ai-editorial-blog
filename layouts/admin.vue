<template>
  <div class="min-h-screen">
    <div class="app-container py-4 sm:py-6">
      <div class="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
        <AdminSidebar />
        <div class="min-w-0 pb-4 sm:pb-6 lg:pb-0">
          <AdminTopbar />
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
