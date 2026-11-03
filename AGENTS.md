<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Service orders store the full form in `service_orders.dados` (plus whatsapp/valor/dates columns) so any order's PDF can be rebuilt when its stored file is missing.
- Never declare React components inside another component's body (it remounts children every render and inputs lose focus).
