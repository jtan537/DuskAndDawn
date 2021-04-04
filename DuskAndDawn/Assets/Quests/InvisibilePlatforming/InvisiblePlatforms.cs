using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class InvisiblePlatforms : MonoBehaviour
{
    private GameObject[] _platforms;
    private Metadata _metadata;
    private GameObject _curPlayer;

    bool enteredShowPlatformZone = false;
    // Start is called before the first frame update
    void Start()
    {
        _platforms = GameObject.FindGameObjectsWithTag("DuskInvisiblePlatform");
        _metadata = GameObject.FindObjectOfType<Metadata>().GetComponent<Metadata>();
    }

    // Update is called once per frame
    void Update()
    {
        _curPlayer = _metadata.getCurPlayer();
        enteredShowPlatformZone = gameObject.GetComponent<EnableDuskPlatforms>().enteredShowPlatformZone;
        if (!enteredShowPlatformZone && GameObject.Find("Lighting").transform.Find("Dusk Lighting").gameObject.activeSelf)
        {
            foreach (GameObject platform in _platforms)
            {
                platform.GetComponent<MeshRenderer>().enabled = false;
            }
        } else
        {
            foreach (GameObject platform in _platforms)
            {
                platform.GetComponent<MeshRenderer>().enabled = true;
            }
        }
    }
}
