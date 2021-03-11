using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ActivateDuskPlatformHighlights : MonoBehaviour
{
    GameObject[] _duskInvisPlatforms;
    Metadata metadata;
    GameObject curPlayer;

    public bool dawnInZone;

    // Start is called before the first frame update
    void Start()
    {
        metadata = GameObject.FindObjectOfType<Metadata>();
        _duskInvisPlatforms = GameObject.FindGameObjectsWithTag("DuskInvisiblePlatform");
        curPlayer = metadata.getCurPlayer();
        dawnInZone = false;
        foreach (GameObject platform in _duskInvisPlatforms)
        {
            platform.GetComponent<MeshRenderer>().material.SetShaderPassEnabled("Always", false);
        }
    }


    private void OnTriggerEnter(Collider other)
    {
        curPlayer = metadata.getCurPlayer();
        dawnInZone = true;
        if (curPlayer.name == gameObject.tag)
        {
            if (other.CompareTag("Player"))
            {
                if (other.gameObject.name == "Dawn")
                {
                    foreach (GameObject platform in _duskInvisPlatforms)
                    {
                        platform.GetComponent<MeshRenderer>().material.SetShaderPassEnabled("Always", true);
                    }
                }
            }

        }
    }

    private void OnTriggerExit(Collider other)
    {
        curPlayer = metadata.getCurPlayer();
        dawnInZone = false;
        if (curPlayer.name == gameObject.tag)
        {
            if (other.CompareTag("Player"))
            {
                if (other.gameObject.name == "Dawn")
                {
                    foreach (GameObject platform in _duskInvisPlatforms)
                    {
                        platform.GetComponent<MeshRenderer>().material.SetShaderPassEnabled("Always", false);
                    }
                }
            }
        }
    }
}
