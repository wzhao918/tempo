<script>
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import Hero from '$lib/components/Hero.svelte';
  import Timeline from '$lib/components/Timeline.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
</script>

<Header />
<Hero />

<div class="main">
  <Timeline />
  <Sidebar />
</div>

<style>
  .main {
    display: grid;
    grid-template-columns: 1fr 320px;
    flex: 1;
    gap: 0;
  }
</style>
