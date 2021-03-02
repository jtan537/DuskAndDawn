using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class UpdateRespawnPoint : MonoBehaviour
{
    public void updateRespawnPosition(Vector3 pos)
    {
        transform.position = pos;
    }
}
