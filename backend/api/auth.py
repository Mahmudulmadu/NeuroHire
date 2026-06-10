from fastapi import Header


async def get_current_user(x_user_id: str | None = Header(default=None)) -> str:
    return x_user_id or "local-demo-user"