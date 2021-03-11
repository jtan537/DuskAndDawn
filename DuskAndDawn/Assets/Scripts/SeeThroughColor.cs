using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SeeThroughColor : MonoBehaviour
{

    [SerializeField]
    Color _color;
    // Start is called before the first frame update
    SkinnedMeshRenderer renderer;
    private string _curPlayerName;
    private void Start()
    {
        renderer = gameObject.GetComponent<SkinnedMeshRenderer>();
        foreach (Material _mat in renderer.materials)
        {
            _mat.SetColor("_SeeThroughColor", _color);
        }
    }
    void Update()
    {
        _curPlayerName = GameObject.FindObjectOfType<Metadata>().getCurPlayer().name;
        if (_curPlayerName == gameObject.tag)
        {
            //Enable see through
            foreach (Material _mat in renderer.materials)
            {
                _mat.SetShaderPassEnabled("Always", true);
            }
            
        } else
        {
            //Disable see through when character is swapped, avoiding seeing the seethrough animation as Dawn while playing as Dusk.
            foreach (Material _mat in renderer.materials)
            {
                _mat.SetShaderPassEnabled("Always", false);
            }
        }


    }

}
